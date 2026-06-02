import { fetchToolkit } from "$lib/server/file";

export const load = async ({ depends }) => {
    depends('watch:toolkit');
    const toolkit = await fetchToolkit();
    return { 
        toolkit
    };
}