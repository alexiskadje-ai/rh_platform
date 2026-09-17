"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CANDIDATE_PACK_QUERY } from "@/lib/shop-packs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BoostCareerCta({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/boutique?pack=${CANDIDATE_PACK_QUERY}`}
        className={cn(buttonVariants({ variant: "accent" }), className)}
      >
        <Sparkles className="size-4" />
        Booster ma carrière
      </Link>
    </motion.div>
  );
}
