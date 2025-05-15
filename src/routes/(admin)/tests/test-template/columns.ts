import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";

import Eye from '@lucide/svelte/icons/eye';
import { renderSnippet } from "$lib/components/ui/data-table/index.js";
import type { E } from "vitest/dist/chunks/environment.d.C8UItCbf.js";
import { renderComponent } from "$lib/components/ui/data-table/index.js";

 
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Question = {
 id: number;
    question: string;
    options: string[];
      answer: string[];
    tags: string[];
};
 
export const columns: ColumnDef<Question>[] = [
 {
  accessorKey: "id",
  header: "ID",
  },
  {
  accessorKey: "question",
  header: "Question",
 },
//  {
//   accessorKey: "options",
//   header: "Options",
//   },
  {
    accessorKey: "optionHide",
    header: "Options",
    cell: ({ row }) => {
      // You can pass whatever you need from `row.original` to the component
      return renderComponent(Eye, { class: "w-full h-4 text-center align-center mx-auto" });
    },

  },
  {
  accessorKey: "answer",
  header: "Answer",
 },
 {
  accessorKey: "tags",
  header: "Tags",
  },
 

];