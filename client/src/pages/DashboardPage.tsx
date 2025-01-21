import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link } from "wouter";
import { useVideos } from "@/hooks/use-videos";
import { StatsOverview } from "@/components/dashboard/StatsOverview";

export default function DashboardPage() {
  const { projects, createProject } = useProjects();
  const { videos } = useVideos();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filteredProjects = projects?.filter(project => 
    project.name.toLowerCase().includes(search.toLowerCase()) ||
    project.description?.toLowerCase().includes(search.toLowerCase())
  );

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: { name: string; description: string }) => {
    try {
      await createProject(data);
      setDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  placeholder="Project Name"
                  {...form.register("name", { required: true })}
                />
                <Input
                  placeholder="Description"
                  {...form.register("description")}
                />
                <Button type="submit" className="w-full">
                  Create Project
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <StatsOverview />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects?.map((project) => (
          <Link key={project.id} href={`/project/${project.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}