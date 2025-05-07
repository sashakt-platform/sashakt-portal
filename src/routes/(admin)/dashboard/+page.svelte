<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import Label from "$lib/components/ui/label/label.svelte";
    import Info from "@lucide/svelte/icons/info";
    const information = [
    { title: "Manage Question Banks", description: "Effortlessly create, edit, and organize question banks to keep everything at your fingertips."},
    { title: "Generate Test Templates", description: "Customize test templates to suit diverse requirements, ensuring consistency and ease of use." },
    { title: "Create and Assign Tests", description: "Build, schedule, and assign tests seamlessly to streamline the evaluation process." },
    { title: "Monitor Analytics", description: "Gain valuable insights through detailed analytics to track performance and progress." },
    { title: "User Management", description: "Add, manage, and oversee user roles to ensure collaboration and control." }
    ]
    
    const stats_box=[
        {title:'Total Questions', description: "Stats and Generated Insights"},
        {title:'Tests', description: "Stats and Generated Insights"},
        {title:'Users', description: "Stats and Generated Insights"},
    ]



  </script>



  <Dialog.Root open={true} >
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Welcome to Sashakt!</Dialog.Title>
        <Dialog.Description>
            Here’s what all you can do
        </Dialog.Description>
      </Dialog.Header>
      <div class='w-full  p-4 rounded-xl' style="background:#F0F9FF">
        {#each information as item}
        <div class="mb-4">
            <p class="font-semibold">{item.title}</p>
            <p class="text-sm font-light">{item.description}</p>
        </div>
        {/each}
    </div>
    <Button style='background:#0369A1' class='cursor-pointer'>Get Started</Button>
    </Dialog.Content>
  </Dialog.Root>



<div class='mt-10 ml-10 w-full  flex align-middle items-center'>
    <span class="flex flex-row">
    <h2
     class="scroll-m-20  pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 w-fit mr-2"
    >
    Dashboard
    </h2>
    <Info class='text-xs w-4 text-gray-600 align-middle my-auto'/>
    </span>
    </div>
    <Label class="ml-10 text-sm font-extralight my-auto align-middle">View Data related to Tests and Questions </Label>

    <div>
        <div class='ml-10 mt-4 flex flex-row justify-between  w-3/4'>
            
            {#each stats_box as stat}
                <div class='bg-white w-1/3 m-4 p-4 rounded-xl'>
                    <p class='font-semibold'>{stat.title}</p>
                    <p class='text-sm'>{stat.description}</p>
                    <div class="w-24 h-24"></div>
                </div>
            {/each}

        </div>
        <div class='ml-10 mt-4 flex flex-row justify-between  w-3/4'>
            <div class='bg-white w-1/2 h-1/2 m-4 mb-10 p-4 rounded-xl'>
                <div class="w-full h-screen"></div>
            </div>        
            <div class='bg-white w-1/2 h-1/2 m-4 p-4 rounded-xl'>
                <div class="w-full h-screen"></div>
            </div>
        </div>

    </div>