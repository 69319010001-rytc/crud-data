import { NextRequest, NextResponse } from "next/server";
import pool, { getStudentsTableName } from "@/lib/db";

interface RouteParams {
  params: Promise<{
    sid: string;
  }>;
}

// GET /api/students/[sid] - Get single student
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sid } = await params;
    const parsedSid = parseInt(sid, 10);
    const tableName = await getStudentsTableName();

    const result = await pool.query(
      `SELECT sid, sname, "phone " AS phone FROM ${tableName} WHERE sid = $1`,
      [parsedSid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Student with ID '${sid}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("GET /api/students/[sid] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch student" },
      { status: 500 }
    );
  }
}

// PUT /api/students/[sid] - Update student information
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sid } = await params;
    const parsedSid = parseInt(sid, 10);
    const body = await request.json();
    const { sname, phone } = body;

    if (!sname || (typeof sname === "string" && !sname.trim())) {
      return NextResponse.json(
        { success: false, error: "Student Name (sname) is required" },
        { status: 400 }
      );
    }

    let parsedPhone: number | null = null;
    if (phone !== undefined && phone !== null && phone.toString().trim() !== "") {
      const cleanPhone = phone.toString().replace(/\D/g, "");
      parsedPhone = cleanPhone ? parseInt(cleanPhone, 10) : null;
    }

    const tableName = await getStudentsTableName();

    const result = await pool.query(
      `UPDATE ${tableName} 
       SET sname = $1, "phone " = $2 
       WHERE sid = $3 
       RETURNING sid, sname, "phone " AS phone`,
      [sname.trim(), parsedPhone, parsedSid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Student with ID '${sid}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("PUT /api/students/[sid] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update student" },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[sid] - Delete a student
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sid } = await params;
    const parsedSid = parseInt(sid, 10);
    const tableName = await getStudentsTableName();

    const result = await pool.query(
      `DELETE FROM ${tableName} WHERE sid = $1 RETURNING sid, sname, "phone " AS phone`,
      [parsedSid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Student with ID '${sid}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Student with ID '${sid}' deleted successfully`,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("DELETE /api/students/[sid] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete student" },
      { status: 500 }
    );
  }
}
