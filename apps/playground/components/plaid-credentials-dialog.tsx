"use client";

import { useState } from "react";
import { usePlaidCredentials } from "@/lib/plaid/credentials-context";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function PlaidCredentialsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { credentials, setCredentials } = usePlaidCredentials();
  const [clientId, setClientId] = useState(credentials?.clientId ?? "");
  const [secret, setSecret] = useState(credentials?.secret ?? "");

  const handleSave = () => {
    if (clientId.trim() && secret.trim()) {
      setCredentials({
        clientId: clientId.trim(),
        secret: secret.trim(),
      });
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    setCredentials(null);
    setClientId("");
    setSecret("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plaid API Credentials</DialogTitle>
          <DialogDescription>
            Enter your Plaid sandbox credentials to use the API tools. Your
            credentials are stored in your browser only and never persisted
            server-side. Get your keys from the{" "}
            <a
              href="https://dashboard.plaid.com/developers/keys"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Plaid Dashboard
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client-id">Client ID</Label>
            <Input
              id="client-id"
              placeholder="e.g. 5f1a2b3c4d5e6f7a8b9c0d1e"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="secret">Secret (Sandbox)</Label>
            <Input
              id="secret"
              type="password"
              placeholder="e.g. abc123def456..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {credentials && (
            <Button variant="outline" onClick={handleClear}>
              Clear Credentials
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!clientId.trim() || !secret.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
