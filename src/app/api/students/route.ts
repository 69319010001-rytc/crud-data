import { NextRequest, NextResponse } from "next/server";
import pool, { getStudentsTableName } from "@/lib/db";

// GET /api/students - List all students
export async function GET() {
  try {
    const tableName = await getStudentsTableName();
    const result = await pool.query(
      `SELECT sid, sname, "phone " AS phone FROM ${tableName} ORDER BY sid ASC`
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("GET /api/students error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch students",
      },
      { status: 500 }
    );
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sid, sname, phone } = body;

    if (!sid || (typeof sid === "string" && !sid.trim())) {
      return NextResponse.json(
        { success: false, error: "Student ID (sid) is required" },
        { status: 400 }
      );
    }

    if (!sname || (typeof sname === "string" && !sname.trim())) {
      return NextResponse.json(
        { success: false, error: "Student Name (sname) is required" },
        { status: 400 }
      );
    }

    const parsedSid = parseInt(sid.toString().trim(), 10);
    if (isNaN(parsedSid)) {
      return NextResponse.json(
        { success: false, error: "Student ID must be a valid number" },
        { status: 400 }
      );
    }

    let parsedPhone: number | null = null;
    if (phone !== undefined && phone !== null && phone.toString().trim() !== "") {
      const cleanPhone = phone.toString().replace(/\D/g, "");
      parsedPhone = cleanPhone ? parseInt(cleanPhone, 10) : null;
    }

    const tableName = await getStudentsTableName();

    // Check for duplicate sid
    const checkResult = await pool.query(
      `SELECT sid FROM ${tableName} WHERE sid = $1`,
      [parsedSid]
    );

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: `Student with ID '${parsedSid}' already exists` },
        { status: 409 }
      );
    }

    const insertResult = await pool.query(
      `INSERT INTO ${tableName} (sid, sname, "phone ") VALUES ($1, $2, $3) RETURNING sid, sname, "phone " AS phone`,
      [parsedSid, sname.trim(), parsedPhone]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Student added successfully",
        data: insertResult.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/students error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create student" },
      { status: 500 }
    );
  }
}
