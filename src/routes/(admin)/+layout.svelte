<script lang="ts">
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
	import Label from "$lib/components/ui/label/label.svelte";

    let { children } = $props();
   </script>
    
   <Sidebar.Provider>
    <AppSidebar />
    <main>
    <div class="flex my-4">
     <Sidebar.Trigger class='border-r-2 rounded-none mx-4 w-14' />
     <span class="text-sm my-auto align-middle">Question Page <ChevronRight class="inline text-sm w-4" /></span>
    
    </div>
     <hr class="w-screen "/>
     {@render children?.()}
    </main>
   </Sidebar.Provider>