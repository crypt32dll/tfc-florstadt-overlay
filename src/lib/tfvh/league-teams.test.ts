import { describe, expect, it } from "vitest";
import { localizeCrestUrl } from "@/lib/tfvh/localize-crest";
import {
  findLeagueTeam,
  LEAGUE_TEAMS_FALLBACK,
  parseTeamDetailsLogo,
  parseVerbandsligaTeams,
  toHiResCrestUrl,
} from "@/lib/tfvh/parse-league-teams";

const FIXTURE = `
<tr class="sectiontableentry1">
  <td>1</td>
  <td>
    <table><tr>
      <td><a href="/index.php/verbandsliga-sued?task=team_details&id=1818">TFC Staufenberg 3</a></td>
      <td><img src="https://tfvh.de/images/sportsmanager/vereine/I4T1753214571W28H28.jpg" width="28" /></td>
    </tr></table>
  </td>
</tr>
<tr class="sectiontableentry2">
  <td>6</td>
  <td>
    <table><tr>
      <td><a href="/index.php/verbandsliga-sued?task=team_details&id=1816">TFC Florstadt 1</a></td>
      <td><img src="https://tfvh.de/images/sportsmanager/vereine/I72T1753214547W28H28.png" /></td>
    </tr></table>
  </td>
</tr>
<tr class="sectiontableentry1">
  <td>7</td>
  <td>
    <table><tr>
      <td><a href="/index.php/verbandsliga-sued?task=team_details&id=1819">TSC Fr&auml;nkisch-Crumbach 3</a></td>
      <td><img src="https://tfvh.de/images/sportsmanager/vereine/I55T1753214548W28H28.jpg" /></td>
    </tr></table>
  </td>
</tr>
`;

const TEAM_DETAILS_FIXTURE = `
<H2>TFC Florstadt 1</H2>
<table class="contentpaneopen">
  <tr>
    <td nowrap><img src="https://tfvh.de/images/sportsmanager/vereine/I72T1753214547W240H240.png" width="240" height="240" border="0" /></td>
  </tr>
</table>
`;

describe("toHiResCrestUrl", () => {
  it("upgrades W28H28 thumbs to W240H240", () => {
    expect(
      toHiResCrestUrl(
        "https://tfvh.de/images/sportsmanager/vereine/I4T1753214571W28H28.jpg",
      ),
    ).toBe(
      "https://tfvh.de/images/sportsmanager/vereine/I4T1753214571W240H240.jpg",
    );
  });
});

describe("localizeCrestUrl", () => {
  it("maps TFVH remote URLs to /crests/{id}", () => {
    expect(
      localizeCrestUrl(
        "https://tfvh.de/images/sportsmanager/vereine/I72T1753214547W240H240.png",
        "1816",
      ),
    ).toBe("/crests/1816.png");
  });
});

describe("parseTeamDetailsLogo", () => {
  it("reads the 240px crest from Mannschaftsseite HTML", () => {
    expect(parseTeamDetailsLogo(TEAM_DETAILS_FIXTURE)).toBe(
      "https://tfvh.de/images/sportsmanager/vereine/I72T1753214547W240H240.png",
    );
  });
});

describe("parseVerbandsligaTeams", () => {
  it("extracts name, id, and local crest path", () => {
    const teams = parseVerbandsligaTeams(FIXTURE);
    expect(teams).toHaveLength(3);
    expect(teams[0].id).toBe("1818");
    expect(teams[0].name).toBe("TFC Staufenberg 3");
    expect(teams[0].logoUrl).toBe("/crests/1818.jpg");
    expect(teams[2].name).toBe("TSC Fränkisch-Crumbach 3");
  });
});

describe("findLeagueTeam", () => {
  it("matches Florstadt shorthand with local crest", () => {
    const hit = findLeagueTeam(LEAGUE_TEAMS_FALLBACK, "TFC Florstadt");
    expect(hit?.id).toBe("1816");
    expect(hit?.logoUrl).toBe("/crests/1816.png");
  });
});
