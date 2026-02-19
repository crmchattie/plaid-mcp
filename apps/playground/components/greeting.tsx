"use client";

import { motion } from "framer-motion";
import { BookOpenIcon, ServerIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaidIcon } from "./icons";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center gap-6 px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <div className="flex flex-col gap-2">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 font-semibold text-xl md:text-2xl"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5 }}
        >
          <PlaidIcon size={28} />
          <span>Plaid MCP Playground</span>
        </motion.div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-zinc-500 md:text-base"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.6 }}
        >
          Explore the Plaid API through conversation. Ask questions about
          Plaid&apos;s docs, or test API endpoints with built-in sandbox
          credentials.
        </motion.div>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpenIcon className="size-5 text-muted-foreground" />
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Search guides, API references, and integration docs.
            </p>
            <Badge
              className="bg-green-500/10 text-green-700 dark:text-green-400"
              variant="secondary"
            >
              Always available
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ServerIcon className="size-5 text-muted-foreground" />
              Plaid API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Create sandbox items, fetch accounts, balances, transactions &amp; more.
            </p>
            <Badge
              className="bg-green-500/10 text-green-700 dark:text-green-400"
              variant="secondary"
            >
              Sandbox credentials included
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
