"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

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
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
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

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center gap-2">
        <Link href="/players" className="text-white">←</Link>
        <h1 className="text-xl font-bold">Edit Player</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
            <input {...register("fullName")} className="w-full px-4 py-3 rounded-lg border border-gray-300" />
            {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short name</label>
            <input {...register("shortName")} className="w-full px-4 py-3 rounded-lg border border-gray-300" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register("isKeeper")} id="keeper" />
            <label htmlFor="keeper">Wicket keeper</label>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-lg bg-cricket-green text-white font-semibold">Save</button>
        </form>
      </main>
    </div>
  );
}
