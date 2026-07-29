import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight, Sparkles } from "lucide-react";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  category?: string;
  amount?: number;
  membership?: string;
  event_date?: string | null;
  venue?: string | null;
  cover_image_url?: string | null;
  registration_count?: number;
}

export default function EventCard(props: EventCardProps) {
  const { id, title, description, category = "Technical", amount = 0, membership, venue, cover_image_url, registration_count } = props;

  return (
    <div className="glass glass-interactive" style={{ borderRadius: "1.25rem", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Cover image container */}
      <div style={{
        height: "200px",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        background: cover_image_url
          ? `url(${cover_image_url}) center/cover no-repeat`
          : "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.15) 100%)",
      }}>
        {/* Fee & Membership Badges */}
        <div style={{ position: "absolute", top: "0.85rem", left: "0.85rem", display: "flex", gap: "0.5rem" }}>
          <span style={{
            background: amount > 0 ? "rgba(16,185,129,0.85)" : "rgba(99,102,241,0.85)",
            color: "#ffffff",
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 800,
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}>
            {amount > 0 ? `₹${amount}` : "FREE ENTRY"}
          </span>
        </div>

        {membership && (
          <div style={{ position: "absolute", top: "0.85rem", right: "0.85rem" }}>
            <span style={{
              background: "rgba(15,18,35,0.75)",
              color: "#a78bfa",
              border: "1px solid rgba(167,139,250,0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.725rem",
              fontWeight: 700,
              backdropFilter: "blur(8px)",
            }}>
              {membership}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.6rem", lineHeight: 1.3 }}>
            {title}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.25rem", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {description}
          </p>

          {/* Location & Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {venue && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.825rem" }}>
                <MapPin size={14} color="#6366f1" />
                <span>{venue}</span>
              </div>
            )}
            {registration_count !== undefined && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.825rem" }}>
                <Users size={14} color="#10b981" />
                <span>{registration_count} registered</span>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <Link href={`/events/${id}`} style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}>
            View Details & Register <ArrowRight size={16} />
          </button>
        </Link>
      </div>
    </div>
  );
}
