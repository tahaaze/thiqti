import { redirect } from "next/navigation";

export default function SearchPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return redirect("/results");
}
