import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ApiError } from "next/dist/server/api-utils";
import profileSchema from "@/app/_schema/profileSchema";
import transformedZodErrors from "@/app/_utils/transformedZodError";

export async function GET(request, context) {
  try {
    const userId = context.params.id;
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    // Check if the user exists
    if (!data) throw new ApiError(400, "The user does not exist!");
    if (error) {
      if (!error.status) error.status = 400;
      throw new ApiError(error.status, error.message);
    }
    return NextResponse.json({
      error: null,
      data: { user: data },
      status: 200,
      message: "OK",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: error.statusCode }
    );
  }
}

export async function PUT(request, context) {
  try {
    const userId = context.params.id;
    const supabase = createRouteHandlerClient({ cookies });
    // Request's body validation. Always return 400 error if invalid.
    let user = await request.json();
    const result = profileSchema.safeParse(user);
    if (result.error) throw transformedZodErrors(result.error);
    else user = result.data;
    // Check if the product exists
    const { data, error } = await supabase
      .from("profile")
      .update(user)
      .eq("user_id", userId)
      .select()
      .maybeSingle();
    // User do not have sufficient rights to edit the user.
    if (error?.code === "42501")
      throw new ApiError(401, "User do not have sufficient rights");
    if (error) {
      if (!error.status) error.status = 400;
      throw new ApiError(error.status, error.message);
    }
    // Cannot find the user to update => No returning user => Hacky?
    if (!data) throw new ApiError(400, "The user cannot be updated!");

    return NextResponse.json({
      error: null,
      data: { user: data },
      status: 200,
      message: "OK",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: error.statusCode }
    );
  }
}
