/* @malted says:
 * Hi! Welcome to `data.ts` :)
 * These are critical functions primarily used by `middleware.ts`.
 *
 * If you need the user's ships for example, you should not be here.
 * You should instead use the cookie, which is set by `middleware.ts`.
 *
 * Do not use any libraries here.
 * This module is imported into the Vercel edge runtime
 * You've been warned.
 */

//#region Ships
export type ShipType = "project" | "update";
export type ShipStatus = "shipped" | "staged" | "deleted";
export interface Ship {
  id: string; // The Airtable row's ID.
  title: string;
  repoUrl: string;
  deploymentUrl?: string;
  readmeUrl: string;
  screenshotUrl: string;
  // doubloonsPaid?: number;
  matchups_count: number;
  hours: number | null;
  credited_hours: number | null;
  total_hours: number | null;
  voteRequirementMet: boolean;
  doubloonPayout: number;
  shipType: ShipType;
  shipStatus: ShipStatus;
  wakatimeProjectNames: string[];
  createdTime: string;
  updateDescription: string | null;
  reshippedFromId: string | null;
  reshippedToId: string | null;
}

export async function fetchShips(personId: string): Promise<Ship[]> {
  const filterFormula = `AND(
    TRUE(),
    '${personId}' = {entrant__slack_id},
    {project_source} = 'high_seas',
    {ship_status} != 'deleted'
  )`;

  const url = `https://api.airtable.com/v0/appTeNFYcUiYfGcR6/ships?filterByFormula=${encodeURIComponent(filterFormula)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
  }).then((data) => data.json());

  return res.records.map((r: any) => {
    const reshippedToIdRaw = r.fields["reshipped_to"] as [string] | null;
    const reshippedToId = reshippedToIdRaw ? reshippedToIdRaw[0] : null;

    const reshippedFromIdRaw = r.fields["reshipped_from"] as [string] | null;
    const reshippedFromId = reshippedFromIdRaw ? reshippedFromIdRaw[0] : null;

    const wakatimeProjectNameRaw = r.fields["wakatime_project_name"] as
      | string
      | null;
    const wakatimeProjectNames = wakatimeProjectNameRaw
      ? wakatimeProjectNameRaw.split("$$xXseparatorXx$$")
      : [];

    const ship: Ship = {
      id: r.id as string,
      title: r.fields["title"] as string,
      repoUrl: r.fields["repo_url"] as string,
      deploymentUrl: r.fields["deploy_url"] as string,
      readmeUrl: r.fields["readme_url"] as string,
      screenshotUrl: r.fields["screenshot_url"] as string,
      voteRequirementMet: Boolean(r.fields["vote_requirement_met"]),
      matchups_count: r.fields["matchups_count"] as number,
      doubloonPayout: r.fields["doubloon_payout"] as number,
      shipType: r.fields["ship_type"] as ShipType,
      shipStatus: r.fields["ship_status"] as ShipStatus,
      wakatimeProjectNames,
      hours: r.fields["hours"] as number | null,
      credited_hours: r.fields["credited_hours"] as number | null,
      total_hours: r.fields["total_hours"] as number | null,
      createdTime: r.fields["created_time"] as string,
      updateDescription: r.fields["update_description"] as string | null,
      reshippedFromId,
      reshippedToId,
    };

    return ship;
  });
}
//#endregion
