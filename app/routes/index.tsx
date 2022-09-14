import { redirect, type LoaderArgs } from "@remix-run/node";

export function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const user = url.searchParams.get("user");
  const repo = url.searchParams.get("repo");
  if (!user || !repo) {
    return null;
  }

  return redirect(`/${user}/${repo}`);
}

export default function Index() {
  return (
    <form>
      <label>
        User
        <br />
        <input name="user" />
      </label>
      <br />
      <label>
        Repo
        <br />
        <input name="repo" />
      </label>
      <br />
      <button type="submit">GO!</button>
    </form>
  );
}
