"use client";

interface Props {
    svg: string;
    logoText?: string;
}

export function QRDisplay({ svg, logoText = "🐄" }: Props) {
    return (
        <div
            style={{
                position: "relative",
                display: "inline-block",
                padding: 24,
                background: "white",
                borderRadius: 24,
                boxShadow: "0 24px 64px rgba(0, 212, 170, 0.25)",
            }}
            className="pulse-glow"
        >
            {/* QR SVG */}
            <div
                style={{ display: "block", width: 320, height: 320 }}
                dangerouslySetInnerHTML={{ __html: svg }}
            />

            {/* Logo overlay in center */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "white",
                    border: "4px solid #00d4aa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
            >
                {logoText}
            </div>
        </div>
    );
}
