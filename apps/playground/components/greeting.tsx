"use client";

import { motion } from "framer-motion";
import { BookOpenIcon, ServerIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlaidCredentials } from "@/lib/plaid/credentials-context";
import { PlaidIcon } from "./icons";
import { PlaidCredentialsDialog } from "./plaid-credentials-dialog";

export const Greeting = () => {
  const { isConfigured } = usePlaidCredentials();
  const [showCredentials, setShowCredentials] = useState(false);

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
          Plaid&apos;s docs, or connect a sandbox account to test API endpoints.
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
            {isConfigured ? (
              <Badge
                className="bg-green-500/10 text-green-700 dark:text-green-400"
                variant="secondary"
              >
                Active
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  variant="secondary"
                >
                  Needs credentials
                </Badge>
                <button
                  className="text-xs underline underline-offset-2 hover:text-foreground"
                  onClick={() => setShowCredentials(true)}
                  type="button"
                >
                  Set Credentials
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {!isConfigured && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-amber-800 dark:text-amber-300">
            Set your Plaid sandbox credentials to unlock all 25 API tools.{" "}
            <a
              className="underline underline-offset-2"
              href="https://dashboard.plaid.com/developers/keys"
              rel="noreferrer"
              target="_blank"
            >
              Get your keys from the Plaid Dashboard
            </a>
          </p>
        </motion.div>
      )}

      <PlaidCredentialsDialog
        open={showCredentials}
        onOpenChange={setShowCredentials}
      />
    </div>
  );
};
