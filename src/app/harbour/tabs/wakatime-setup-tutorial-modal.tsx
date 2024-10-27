import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import Icon from "@hackclub/icons";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { hasHb } from "./tutorial-utils";
import { buttonVariants } from "../../../components/ui/button";

export default function WakatimeSetupTutorialModal({
  isOpen,
  isSubmitting,
  wakaKey,
  handleContinueFromModal,
  wakatimeUsername,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  wakaKey: string;
  handleContinueFromModal: any;
  wakatimeUsername: string;
}) {
  const [userOS, setUserOS] = useState<
    "windows" | "macos" | "linux" | "unknown"
  >("unknown");
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [hasRecvHb, setHasRecvHb] = useState(false);

  const getInstallCommand = (platform: string) => {
    switch (platform) {
      case "windows":
        return {
          label: "Windows PowerShell",
          command: "irm https://wakatime.com/install.ps1 | iex",
          lang: "powershell",
        };
      case "macos":
        return {
          label: "macOS Terminal",
          command: `export BEARER_TOKEN="${wakaKey}" && curl -fsSL https://hack.club/waka-setup.sh | sh`,
          lang: "bash",
        };
      case "linux":
        return {
          label: "Linux Terminal",
          command: `export BEARER_TOKEN="${wakaKey}" && curl -fsSL https://hack.club/waka-setup.sh | sh`,
          lang: "bash",
        };
      default:
        return {
          label: "Unknown Platform",
          command: `export BEARER_TOKEN="${wakaKey}" && curl -fsSL https://hack.club/waka-setup.sh | sh`,
          lang: "bash",
        };
    }
  };

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes("win")) {
      setUserOS("windows");
    } else if (ua.includes("mac")) {
      setUserOS("macos");
    } else if (ua.includes("linux")) {
      setUserOS("linux");
    } else {
      setUserOS("unknown");
      setShowAllPlatforms(true); // Move the setState here
    }

    (async () => {
      while (true) {
        if (wakatimeUsername) {
          const hasData = await hasHb(wakatimeUsername, wakaKey);
          if (hasData && !isSubmitting) {
            await handleContinueFromModal();
            setHasRecvHb(true);
            break;
          }
        }

        await new Promise((r) => setTimeout(r, 1_000));
      }
    })();
  }, []);

  const installInfo = getInstallCommand(userOS);

  const SinglePlatform = ({ platform }: { platform: any }) => {
    return (
      <div>
        <p className="mb-1 inline-flex items-end gap-2">
          <Icon glyph="terminal" size={26} />
          <span>Install instructions for {platform.label}</span>
        </p>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <pre className="text-sm bg-gray-200 rounded-lg p-5 overflow-x-auto w-full flex-grow relative">
            <span className="absolute left-1.5 top-0.5 text-xs opacity-40 select-none pointer-events-none">
              {platform.lang}
            </span>
            <code>{platform.command}</code>
          </pre>
          <Button
            className="h-full px-8"
            onClick={() => navigator.clipboard.writeText(platform.command)}
          >
            Copy
            <Icon glyph="copy" size={26} />
          </Button>
        </div>
      </div>
    );
  };

  const InstallInstructions = () => (
    <>
      <div>
        <h1 className="text-2xl font-bold mb-4">
          {"You're on your way to sail the seas!"}
        </h1>
        <p className="text-base mb-4">
          In order to get rewarded for your time spent coding, we need to know
          when {"you're"} coding! We will do this with an <i>arrsome</i>{" "}
          extension in your code editor!
        </p>

        {showAllPlatforms ? (
          <div>
            <SinglePlatform platform={getInstallCommand("windows")} />
            <SinglePlatform platform={getInstallCommand("macos")} />
            <SinglePlatform platform={getInstallCommand("linux")} />
            <p onClick={() => setShowAllPlatforms(false)}>nevermind</p>
          </div>
        ) : (
          <>
            <SinglePlatform platform={installInfo} />
            <p className="text-xs mt-1">
              Not using {installInfo?.label}?{" "}
              <span
                onClick={() => setShowAllPlatforms(true)}
                className="underline text-blue-500 cursor-pointer"
              >
                View instructions for all platforms
              </span>
            </p>
          </>
        )}

        <video
          src="/videos/Waka Setup Script.mp4"
          autoPlay
          loop
          playsInline
          className="mt-8 rounded"
        />
      </div>

      <p className="text-center mt-2 text-base">
        Waiting for the setup script to be pasted into your terminal...
        <br />
        <br />
        <Button
          className={`${buttonVariants({ variant: "outline" })}`}
          disabled={isSubmitting}
          onClick={async () => {
            await handleContinueFromModal();
            setHasRecvHb(true);
          }}
        >
          or, skip for now
        </Button>
      </p>
    </>
  );

  const CheckUrEmail = () => {
    return (
      <div>
        <p className="text-3xl mb-2">Check your email!</p>
        <p>You should see an invite to the Hack Club Slack.</p>

        <img
          src="/party-orpheus.svg"
          alt="a partying dinosaur"
          className="mt-8 mx-auto w-1/2"
        />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && wakaKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <Card
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto text-left p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {hasRecvHb ? <CheckUrEmail /> : <InstallInstructions />}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
