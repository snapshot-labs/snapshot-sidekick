import { fetchProposal, fetchSpace } from '../helpers/snapshot';

function template(title: string, description: string, url: string, ogImageUrl: string) {
  return `<html>
      <head>
        <title>${title}</title>
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${ogImageUrl}" />
        <meta property="og:url" content="https://snapshot.org/#/${url}" />
        <meta property="og:type" content="article" />
        <meta property="og:image:width" content=1200 />
        <meta property="og:image:height" content=600 />
      </head>
      <body>
      <script>
        window.location = "https://snapshot.org/#/${url}";
      </script>
      </body>
    </html>`;
}

export async function shareSpacePage(spaceId: string) {
  const space = await fetchSpace(spaceId);

  if (space) {
    return template(space.name, space.about || '', space.id, `/og/space/${space.id}`);
  }

  throw new Error('Space not found');
}

export async function shareProposalPage(spaceId: string, proposalId: string) {
  const proposal = await fetchProposal(proposalId);

  if (proposal && proposal.space?.id === spaceId) {
    return template(
      proposal.title,
      '',
      `${spaceId}/proposal/${proposalId}`,
      `/og/proposal/${proposalId}`
    );
  }

  throw new Error('Space/Proposal not found');
}
