import type { ColumnDef } from "@tanstack/table-core";

import Eye from '@lucide/svelte/icons/eye';
import { renderComponent } from "$lib/components/ui/data-table/index.js";
import Checkbox  from "./data-table-checkbox.svelte";

 
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Question = {
  
  
 id: number;
    question: string;
    options: string[];
      answer: number[];
    tags: string[];
};
 
export const columns: ColumnDef<Question>[] = [
  {
    id: "select",
    header: ({ table }) =>
      renderComponent(Checkbox, {
        checked: table.getIsAllPageRowsSelected(),
        indeterminate:
          table.getIsSomePageRowsSelected() &&
          !table.getIsAllPageRowsSelected(),
        onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
        "aria-label": "Select all",
        class: "bg-white", // Added white background
        maxSize:1
      }),
    cell: ({ row }) =>
      renderComponent(Checkbox, {
        checked: row.getIsSelected(),
        onCheckedChange: (value) => {
          row.toggleSelected(!!value);

        },
        "aria-label": "Select row",
      }),
    enableSorting: false,
    enableHiding: false,
    size: -1,
    maxSize: 1,
    
  },

  {
  accessorKey: "question",
    header: "Question",
    size: 200,
    maxSize: 2,

      
 },
//  {
//   accessorKey: "options",
//   header: "Options",
//   },
  {
    accessorKey: "optionHide",
    header: "Answers",
    cell: ({ row }) => {
      // You can pass whatever you need from `row.original` to the component
      return renderComponent(Eye, { class: "text-gray-400 border rounded-4xl" });
    },
    size: -1,
    maxSize: 1,

  },
//   {
//   accessorKey: "answer",
//   header: "Answer",
//  },
 {
  accessorKey: "tags",
   header: "Tags",
   size: 1,
  maxSize: 1,
  },
 

];