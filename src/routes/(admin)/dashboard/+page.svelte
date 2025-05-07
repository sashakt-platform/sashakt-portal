<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    const information = [
    { title: "Manage Question Banks", description: "Effortlessly create, edit, and organize question banks to keep everything at your fingertips."},
    { title: "Generate Test Templates", description: "Customize test templates to suit diverse requirements, ensuring consistency and ease of use." },
    { title: "Create and Assign Tests", description: "Build, schedule, and assign tests seamlessly to streamline the evaluation process." },
    { title: "Monitor Analytics", description: "Gain valuable insights through detailed analytics to track performance and progress." },
    { title: "User Management", description: "Add, manage, and oversee user roles to ensure collaboration and control." }
];


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