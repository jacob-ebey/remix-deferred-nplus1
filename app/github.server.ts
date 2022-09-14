export async function getRepoContents(
  user: string,
  repo: string,
  path?: string | null,
  ref?: string | null
): Promise<
  {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: null | string;
    type: "dir" | "file";
    _links: {
      self: string;
      git: string;
      html: string;
    };
  }[]
> {
  path = path || "";
  const url = new URL(
    `https://api.github.com/repos/${user}/${repo}/contents/${path}`
  );
  ref && url.searchParams.set("ref", ref);
  const response = await fetch(url.href, {
    headers: process.env.GITHUB_TOKEN
      ? {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }
      : undefined,
  });

  return response.json();
}
