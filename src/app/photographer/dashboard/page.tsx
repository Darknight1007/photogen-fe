"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { eventsApi, Event } from "@/lib/api";

interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export default function PhotographerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchEvents = useCallback(async () => {
    const { data } = await eventsApi.getAll({ limit: 50 });
    if (data) {
      setEvents(data.events);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !storedUser) {
      router.push("/photographer/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "PHOTOGRAPHER") {
      router.push("/photographer/login");
      return;
    }

    setUser(parsedUser);
    fetchEvents();
  }, [router, fetchEvents]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const totalPhotos = events.reduce((sum, e) => sum + e.imageCount, 0);
  const totalParticipants = events.reduce((sum, e) => sum + e.participantCount, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-pattern">
      {/* Header */}
      <header className="border-b border-border bg-secondary/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            Photo<span className="gradient-text">Gen</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-muted text-sm">Hi, {user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 📸</h2>
            <p className="text-muted">Manage your events and photos</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary !w-auto !px-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Event
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card !p-6">
            <div className="text-muted text-sm mb-1">Total Events</div>
            <div className="text-3xl font-bold">{events.length}</div>
          </div>
          <div className="card !p-6">
            <div className="text-muted text-sm mb-1">Photos Uploaded</div>
            <div className="text-3xl font-bold">{totalPhotos}</div>
          </div>
          <div className="card !p-6">
            <div className="text-muted text-sm mb-1">Total Participants</div>
            <div className="text-3xl font-bold">{totalParticipants}</div>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-pulse text-muted">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your First Event</h3>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Start by creating an event. Upload photos and let attendees find themselves instantly.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary !w-auto !px-8"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onUpdate={fetchEvents} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </main>
  );
}

function EventCard({ event, onUpdate }: { event: Event; onUpdate: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    await eventsApi.delete(event.id);
    onUpdate();
  };

  const handleToggleActive = async () => {
    await eventsApi.update(event.id, { isActive: !event.isActive });
    onUpdate();
    setShowMenu(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="card !p-0 overflow-hidden group">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 relative">
        {event.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 bg-black/50 backdrop-blur rounded-lg flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-secondary border border-border rounded-lg shadow-xl py-2 min-w-[160px] z-10">
                <Link
                  href={`/photographer/events/${event.id}`}
                  className="block px-4 py-2 text-sm hover:bg-border/50 transition-colors"
                >
                  View Details
                </Link>
                <button
                  onClick={handleToggleActive}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-border/50 transition-colors"
                >
                  {event.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
        {!event.isActive && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-muted/80 backdrop-blur text-xs rounded-md">
              Inactive
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h4 className="font-semibold text-lg mb-1 truncate">{event.name}</h4>
        <p className="text-muted text-sm mb-4">
          {event.location || formatDate(event.eventDate)}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {event.imageCount} photos
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            {event.participantCount}
          </div>
        </div>

        {/* Event Code */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted mb-1">Event Code</div>
              <code className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {event.code}
              </code>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(event.code)}
              className="text-muted hover:text-foreground transition-colors"
              title="Copy code"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Event name is required");
      return;
    }

    setLoading(true);

    const { data, error: apiError } = await eventsApi.create({
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      eventDate: eventDate || undefined,
    });

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    if (data) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="card w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Create New Event</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-6 text-error text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Event Name *</label>
            <input
              type="text"
              placeholder="e.g., Wedding Reception"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              placeholder="Brief description of the event"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl p-4 text-foreground resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              placeholder="e.g., Grand Ballroom, Hotel XYZ"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Date</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <span className="animate-pulse">Creating...</span>
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
