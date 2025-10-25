import { Router } from "express";
import { getPostgresPool } from "../db/postgres.js";

const router = Router();

// GET /bookings/availability?start=2025-10-25&end=2025-10-26&room_type_id=1
router.get("/availability", async (req, res) => {
  const { start, end, room_type_id } = req.query;
  if (!start || !end)
    return res.status(400).json({ error: "start and end are required" });

  try {
    const pool = getPostgresPool();

    // Example SQL using reservation_units with a daterange column called stay_range
    // This is an example placeholder; adjust schema to match your migrations.
    const sql = `
      SELECT r.room_type_id, count(*) as booked
      FROM reservation_units r
      WHERE r.stay_range && tstzrange($1::timestamptz, $2::timestamptz)
      GROUP BY r.room_type_id
    `;

    const { rows } = await pool.query(sql, [start, end]);
    return res.json({ rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "availability check failed" });
  }
});

// POST /bookings/reservations
// Body: { hotel_id, guest_id, room_type_id, start, end }
router.post("/reservations", async (req, res) => {
  const { hotel_id, guest_id, room_type_id, start, end } = req.body;
  if (!hotel_id || !guest_id || !start || !end)
    return res.status(400).json({ error: "missing fields" });

  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert reservation (simple example)
    const insertResSql = `INSERT INTO reservations (hotel_id, guest_id, status, currency, total_amount)
      VALUES ($1,$2,'pending','USD',0) RETURNING id`;
    const r = await client.query(insertResSql, [hotel_id, guest_id]);
    const reservationId = r.rows[0].id;

    // Insert reservation_unit with a stay_range column
    const insertUnitSql = `INSERT INTO reservation_units (reservation_id, room_type_id, stay_range)
      VALUES ($1,$2, tstzrange($3::timestamptz, $4::timestamptz))`;
    await client.query(insertUnitSql, [
      reservationId,
      room_type_id,
      start,
      end,
    ]);

    await client.query("COMMIT");
    return res.status(201).json({ reservationId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "failed to create reservation" });
  } finally {
    client.release();
  }
});

export default router;
