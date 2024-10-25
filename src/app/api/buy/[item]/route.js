import { getSession } from "@/app/utils/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSelfPerson } from "@/app/utils/airtable";

export async function POST(request, { params }) {
  const session = await getSession();
  const person = await getSelfPerson(session.slackId);
  if (!person) {
    return NextResponse.json(
      { error: "i don't even know who you are" },
      { status: 418 },
    );
  }

  const items = await Airtable.base(process.env.BASE_ID)("shop_items");

  const recs = await items
    .select({
      filterByFormula: `{identifier} = '${params.item}'`,
      maxRecords: 1,
    })
    .firstPage();
  if (recs.length < 1) {
    return NextResponse.json({ error: "what do you want?!" }, { status: 418 });
  }
  const item = recs[0];

  const people = await b("people");

  const otp = Math.random().toString(16).slice(2);
  await people.update(person.id, {
    shop_otp: otp,
    shop_otp_expires_at: new Date(
      new Date().getTime() + 5 * 60 * 1000,
    ).toISOString(),
  });
  console.log(item);
  return redirect(`${item.fields.fillout_base_url}${otp}`);
}
