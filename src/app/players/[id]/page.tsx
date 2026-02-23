"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  fullName: z.string().min(1),
  shortName: z.string().optional(),
  isKeeper: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditPlayerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((r) => {
        if (r.status === 404) router.replace("/players");
        return r.json();
      })
      .then((data) => {
        reset({ fullName: data.fullName, shortName: data.shortName ?? "", isKeeper: data.isKeeper ?? false });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, reset, router]);

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch(`/api/players/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError("Failed to update");
      return;
    }
    router.push("/players");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cricket-cream flex items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="page-header">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -ml-2" asChild>
          <Link href="/players">←</Link>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">Edit Player</h1>
        <div className="w-10" />
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-5 pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name *</Label>
                <Input id="fullName" {...register("fullName")} className="h-11" />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName">Short name</Label>
                <Input id="shortName" {...register("shortName")} className="h-11" />
              </div>
              <Controller
                name="isKeeper"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox id="keeper" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="keeper" className="cursor-pointer font-normal">Wicket keeper</Label>
                  </div>
                )}
              />
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 py-2 px-3 rounded-md">{error}</p>
              )}
              <Button type="submit" className="w-full h-11">Save</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
