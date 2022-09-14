import { Suspense, useState } from "react";
import { defer, type LoaderArgs } from "@remix-run/node";
import {
  Await,
  Link,
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
  type Params,
} from "@remix-run/react";

import * as github from "~/github.server";

function getRouteInfo(params: Params, searchParams: URLSearchParams) {
  const user = params.user!;
  const repo = params.repo!;
  const path = searchParams.get("path") || "";

  return { user, repo, path };
}

export async function loader({ params, request }: LoaderArgs) {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref");

  const { user, repo, path } = getRouteInfo(params, url.searchParams);

  const root = await github.getRepoContents(user, repo, path, ref);

  const subDirContent = path
    ? {}
    : Object.fromEntries(
        root
          .filter((entry) => entry.type === "dir")
          .map((entry) => [
            `root_${entry.path}`,
            github.getRepoContents(user, repo, entry.path, ref),
          ])
      );

  const result = {
    ...subDirContent,
    root,
  };

  return defer(
    result as Record<
      `root_${string}`,
      ReturnType<typeof github.getRepoContents>
    > &
      typeof result
  );
}

export default function RepoView() {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const { user, repo, path } = getRouteInfo(params, searchParams);

  return (
    <div className="folder-structure">
      <Link to={`/${user}/${repo}`}>
        {user} / {repo}
      </Link>{" "}
      {path &&
        path.split("/").flatMap((part, index, arr) => [
          " / ",
          index === arr.length - 1 ? (
            part
          ) : (
            <Link key={part} to={`?path=${arr.slice(0, index + 1).join("/")}`}>
              {part}
            </Link>
          ),
        ])}
      <ul>
        {loaderData.root.map((item) => (
          <TreeItem
            key={item.path}
            item={item}
            parentPath={path}
            children={loaderData[`root_${item.path}`]}
          />
        ))}
      </ul>
      {/* <ul>
        <li>
          ...
          <ul>
            <li>
              ...
              <ul>
                <li>...</li>
                <li>...</li>
                ...
              </ul>
            </li>
            <li>...</li>
            ...
          </ul>
        </li>
      </ul> */}
    </div>
  );
}

function TreeItem({
  item,
  parentPath,
  children,
}: {
  item: Awaited<ReturnType<typeof github.getRepoContents>>[number];
  parentPath?: string;
  children?:
    | Awaited<ReturnType<typeof github.getRepoContents>>
    | ReturnType<typeof github.getRepoContents>;
}) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();

  const { user, repo } = getRouteInfo(params, searchParams);

  const label = parentPath ? item.path.slice(parentPath.length + 1) : item.path;

  children = children || (fetcher.data && fetcher.data.root);

  return (
    <li>
      {item.type === "dir" ? (
        <Link to={`?path=${item.path}`}>
          {label}
          <>
            {" "}
            <button
              onClick={(event) => {
                setOpen(!open);

                if (
                  !children &&
                  !open &&
                  fetcher.state !== "loading" &&
                  !fetcher.data
                ) {
                  fetcher.load(`/${user}/${repo}?path=${item.path}`);
                }

                event.preventDefault();
              }}
            >
              {open ? "⬆️" : "⬇️"}
            </button>
          </>
        </Link>
      ) : (
        label
      )}
      {open && (
        <Suspense fallback={<TreeItemFallback />}>
          {fetcher.state === "loading" ? (
            <TreeItemFallback />
          ) : (
            <Await resolve={children}>
              {(children) =>
                children &&
                children.length > 0 && (
                  <ul>
                    {children.map((child) => (
                      <TreeItem
                        key={child.path}
                        item={child}
                        parentPath={item.path}
                      />
                    ))}
                  </ul>
                )
              }
            </Await>
          )}
        </Suspense>
      )}
    </li>
  );
}

function TreeItemFallback() {
  return <div>Loading...</div>;
}
