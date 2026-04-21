import React, { useState } from 'react';
import './style.css';

function App() {
  const [page, setPage] = React.useState('menu');

  const goBack = () => setPage('menu');

  const partyDescriptions = [
      "SA (Socialist Alliance) (Academically Far-Left, Socially Left) A historical socialist/communist party that was the inspiration for the RLP. It declined in popularity because it was too idealistic, something the RLP rectified. It sees occasional resurgences when RLP policies get old.",
      "MCP (Moderate-Centre Party) (Academically Left, Socially Left) The big-tent left-wing/centrist party, similar to the modern democratic party. Originally founded as a newer broad centrist alternative to the LEP back when it was a socially leftist party, now it has totally supplanted the LEP in its former role and shifted leftward socially. Main advocate for rest and other indirect measures to promote academic performance in addition to the YPP and sometimes the LEP.",
      "LEP (Liberty-Equality Party) (Academically Left, Socially Right [Formerly Left]) Before the rise of the RLP, the LEP was the dominant party in early high school. The old LEP stood for liberal ideals, combined with liberal academic approaches. However, in the run-up to college, a series of debacles caused by its lax academic stance caused it to loose much popularity, with its former little sister the MCP taking much its former influence in the liberal sphere. Afterwards, the LEP has reinvented itself as a stalwartly socially conservative (right-wign) party promoting \"properity\", hanging on left-wing academic policies. The modern LEP enjoys electoral successes usually under conditions of demobilization after an academic semester.",
      "MU (Musical Union) (Nonpartisan) As the domestic musical industry faced attacks and potential decline in high school under growing academic pressure, it felt that no party was willing to represent its interests. Thus, the MU was born as a splinter faction of the AU. The Musical Union represents the Richardian interest in piano/composing at a given time. It is nonpartisan and works with any parties willing to secure music in the budget.",
      "AU (Academic Union) (Academically Center-Right, Socially Right) Originally a direct competitor to the RLP with almost the exact same platform (albeit taking even less of a social position), the AU was beset by internal infighting and faded in obscurity. As of late it has seen a resurgence in popularity as many realize the republic lacks an alternative to the dying RLP conservative hegenomy, with the AU becoming a more academically purist alternative to the RLP.",
      "NAP (Nationalist Alliance Party) (Academically Far-Right, Socially Far-Right) Similar to the SA, a historical far-right party that exists during the early unstable stages of Richardian democracy that is no longer extant. Advocated sharp nationalistic academic change, ultra-conservative social ideology (something lost to later parties) and strengthening of the executive branch to effect that.",
      "RLP (Reform Labour Party) (Academically Right, Socially Center-Right) The dominant party since the fall of the LEP, it has recently seen struggles for influence. The RLP was born out of popular dissatification with the policies of the SA and a desire for a more syncretist approach to economics, combining right-wing \"grit\" with left-wing optimism and planning. The resulting RLP swept to power in the Second Academic Revolution in the sophomore year of high school. The RLP holds light conservative social views, believing that academics is their primary platform. The RLP is the republic's premier academic party; other parties are often the exception to the RLP hegenomy.",
      "CDoP (Crown Dominion Party) (Academically Far-Right, Socially Right) Represents parental influence and support in the Richardian republic, as our constitutional structure still grants significant powers to parents as a Dominion of a broader Empire. The CDoP nominally doesn't hold \"petty\" positions on domestic politics, but typically acts academically and socially conservative. Most left-wing parties hold somewhat of a disdain for the CDoP.",
      "YPP (Youth Power Party) (Academically Left, Socially Left) Represents the youth and liberal academics. Nicknamed the “happy party,” it has a particularly energetic spirit, focusing on friendships, love, and \"responsible\" light academics as its primary platform. The YPP enjoys sustained popularity with new friends, partners, or academic booms that allow the pursuit of more relaxed academic policies. It has no problem with collaborating with the MCP, as their views and goals usually align. As of lately, the YPP has positioned itself further left as the party representing rebellion against the parents instead of autonomy advocated for by more moderate parties. This has pitted it directly against the CDoP.",
  ];

  const parentalDescriptions = [
      "Parental influence is the measure of how strongly the parents can influence our actions. In context of the wider government, it is the degree of association between the Crown and the Dominion.",
      "Independence is the measure of how strongly domestic sentiment dictates actions. In context of the wider government, it is the power of the Republic within the Dominion."
  ];

  return (
    <>
      {page === 'menu' && (
        <div id="selectionScreen">
          <h1>Select Data View</h1>
          <button onClick={() => setPage('electoral')}>Electoral Data</button>
          <button onClick={() => setPage('parental')}>Parental Data</button>
        </div>
      )}

      {page === 'electoral' && (
        <DataPage
          title="Richardian Electoral Data"
          csvFile="/docs/output.csv"
          descriptions={partyDescriptions}
          goBack={goBack}
        />
      )}

      {page === 'parental' && (
        <DataPage
          title="Parental Influence Data"
          csvFile="/docs/outputPar.csv"
          descriptions={parentalDescriptions}
          goBack={goBack}
        />
      )}
    </>
  );
}
