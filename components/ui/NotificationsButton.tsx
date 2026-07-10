"use client";

// Knopf, mit dem Amelie taegliche Erinnerungen anschaltet. Muss in der zum
// Home-Bildschirm hinzugefuegten App getippt werden (iOS-Voraussetzung).
import { useEffect, useState } from "react";
import { enablePush, pushPermission, pushSupported } from "@/lib/push";
import { getProfile } from "@/lib/device";
import { Card } from "./Card";
import { Button } from "./Button";

type UiState = "checking" | "unsupported" | "off" | "on" | "denied" | "working";

export function NotificationsButton() {
  const [state, setState] = useState<UiState>("checking");

  useEffect(() => {
    if (!pushSupported()) {
      setState("unsupported");
      return;
    }
    const perm = pushPermission();
    setState(perm === "granted" ? "on" : perm === "denied" ? "denied" : "off");
  }, []);

  if (state === "checking" || state === "unsupported") {
    // Auf nicht unterstützten Geräten (z. B. Safari ohne Home-Screen) nichts zeigen.
    return null;
  }

  async function turnOn() {
    setState("working");
    const ok = await enablePush(getProfile());
    setState(ok ? "on" : pushPermission() === "denied" ? "denied" : "off");
  }

  return (
    <Card className="flex flex-col gap-2 p-4">
      <p className="text-base font-bold text-ink">🔔 Tägliche Erinnerungen</p>
      {state === "on" ? (
        <p className="text-sm text-ink/70">
          Erinnerungen sind an. Du bekommst mittags, nachmittags und abends einen
          kleinen Anstupser. 💚
        </p>
      ) : state === "denied" ? (
        <p className="text-sm text-ink/70">
          Erinnerungen sind ausgeschaltet. Du kannst sie in den Einstellungen
          deines Handys für diese App wieder erlauben.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink/70">
            Lass dich 3-mal am Tag ans Üben erinnern.
          </p>
          <Button
            size="lg"
            full
            disabled={state === "working"}
            onClick={turnOn}
          >
            {state === "working"
              ? "Einen Moment …"
              : "Erinnerungen anschalten"}
          </Button>
        </>
      )}
    </Card>
  );
}
