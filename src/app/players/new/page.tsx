"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const schema = z.object({
  fullName: z.string().min(1, "Name required"),
  shortName: z.string().optional(),
  isKeeper: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewPlayerPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isKeeper: false },
  });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error?.message ?? "Failed to create player");
      return;
    }
    router.push("/players");
  }

  return (
    <div className="min-h-screen bg-cricket-cream">
      <header className="bg-cricket-green text-white px-4 py-4 flex items-center gap-2">
        <Link href="/players" className="text-white">←</Link>
        <h1 className="text-xl font-bold">New Player</h1>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
            <input
              {...register("fullName")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300"
              placeholder="e.g. John Smith"
            />
            {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short name</label>
            <input
              {...register("shortName")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300"
              placeholder="e.g. J. Smith"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register("isKeeper")} id="keeper" />
            <label htmlFor="keeper">Wicket keeper</label>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-lg bg-cricket-green text-white font-semibold">
            Create Player
          </button>
        </form>
      </main>
    </div>
  );
}
