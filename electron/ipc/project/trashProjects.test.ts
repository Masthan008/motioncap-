import path from "node:path";
import { expect, it, vi } from "vitest";
import { trashLibraryProjects } from "./trashProjects";
it("rejects paths outside the project library before touching files", async () => {
	const trash = vi.fn();
	await expect(
		trashLibraryProjects(["/private/tmp/a.motioncap", "/private/tmp/private.txt"], {
			list: async () => ({ entries: [{ path: "/private/tmp/a.motioncap" }] }),
			trash,
			thumbnailPath: (p) => p + ".png",
		}),
	).rejects.toThrow("not in the library");
	expect(trash).not.toHaveBeenCalled();
});
it("trashes only selected project files, deduplicates paths, and reports partial failures", async () => {
	const trash = vi.fn(async (p: string) => {
		if (p.endsWith("b.motioncap")) throw Error("locked");
	});
	const result = await trashLibraryProjects(
		["/private/tmp/a.motioncap", "/private/tmp/a.motioncap", "/private/tmp/b.motioncap"],
		{
			list: async () => ({
				entries: [{ path: "/private/tmp/a.motioncap" }, { path: "/private/tmp/b.motioncap" }],
			}),
			trash,
			thumbnailPath: (p) => p + ".missing.png",
		},
	);
	expect(result.deleted).toEqual([path.resolve("/private/tmp/a.motioncap")]);
	expect(result.errors).toEqual(["Could not trash b.motioncap"]);
	expect(trash.mock.calls.map(([p]) => p)).toEqual([
		path.resolve("/private/tmp/a.motioncap"),
		path.resolve("/private/tmp/b.motioncap"),
	]);
});
