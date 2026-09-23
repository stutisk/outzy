"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Activity {
  id: string;
  title: string;
  description: string;
  city: string;
  activity_date: string;
  max_people: number;
  category: string;
  created_at: string;
  user_id: string;
  host?: {
    username: string;
    avatar_url?: string;
  };
}

interface JoinRequest {
  id: string;
  activity_id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
  requester?: {
    username: string;
    avatar_url?: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  hiking: "🏔️ Hiking",
  coffee: "☕ Coffee",
  cycling: "🚴 Cycling",
  beaches: "🌊 Beaches",
  food: "🍜 Food Tours",
  photography: "📸 Photography",
  art: "🎨 Art & Culture",
  dance: "💃 Music & Dance",
  running: "🏃 Running",
  gaming: "🎮 Gaming",
  yoga: "🧘 Yoga",
  nightlife: "🥂 Nightlife",
};

type TabType = "others" | "mine";

export default function FeedPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("others");
  const router = useRouter();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  // Requests for host
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push("/");
        return;
      }

      // Fetch all activities with host info
      const { data: activitiesData, error } = await supabase
        .from("activities")
        .select("*")
        .order("activity_date", { ascending: true });

      if (error) {
        console.error("Error fetching activities:", error);
        setActivities([]);
        setLoading(false);
        return;
      }

      // Fetch host info for each activity
      if (activitiesData && activitiesData.length > 0) {
        const userIds = [...new Set(activitiesData.map((a) => a.user_id))];

        const { data: profiles } = await supabase
          .from("users")
          .select("id, username, full_name, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.id, p]) || []
        );

        const activitiesWithHost = activitiesData.map((activity) => ({
          ...activity,
          host: profileMap.get(activity.user_id),
        }));

        setActivities(activitiesWithHost);
      } else {
        setActivities([]);
      }
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isUpcoming = (dateStr: string) => {
    const activityDate = new Date(dateStr);
    return activityDate > new Date();
  };

  const isOwnActivity = (activityUserId: string) => {
    return user?.id === activityUserId;
  };

  const openRequestModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
    setRequestMessage("");
  };

  const handleSendRequest = async () => {
    if (!user || !selectedActivity) return;

    if (!requestMessage.trim()) {
      alert("Please add a message explaining why you want to join");
      return;
    }

    setSendingRequest(true);

    try {
      // Check if already requested
      const { data: existingRequest } = await supabase
        .from("activity_requests")
        .select("id")
        .eq("activity_id", selectedActivity.id)
        .eq("user_id", user.id)
        .single();

      if (existingRequest) {
        alert("You've already requested to join this activity!");
        setSendingRequest(false);
        return;
      }

      // Create join request with message
      const { error } = await supabase.from("activity_requests").insert({
        activity_id: selectedActivity.id,
        user_id: user.id,
        message: requestMessage.trim(),
        status: "pending",
      });

      if (error) {
        console.error("Error requesting to join:", error);
        alert("Failed to send request. Please try again.");
      } else {
        alert("Request sent! The host will be notified.");
        setShowModal(false);
        setRequestMessage("");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  };

  // Fetch requests for host's activities
  const fetchRequests = async () => {
    if (!user) return;

    const myActivityIds = activities
      .filter((a) => isOwnActivity(a.user_id))
      .map((a) => a.id);

    if (myActivityIds.length === 0) {
      setRequests([]);
      return;
    }

    const { data: requestsData } = await supabase
      .from("activity_requests")
      .select("*")
      .in("activity_id", myActivityIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requestsData && requestsData.length > 0) {
      const requesterIds = [...new Set(requestsData.map((r) => r.user_id))];

      const { data: profiles } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", requesterIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p]) || []
      );

      const requestsWithRequester = requestsData.map((r) => ({
        ...r,
        requester: profileMap.get(r.user_id),
      }));

      setRequests(requestsWithRequester);
    } else {
      setRequests([]);
    }
  };

  const openRequestsModal = async () => {
    await fetchRequests();
    setShowRequestsModal(true);
  };

  const handleRequest = async (requestId: string, action: "accepted" | "rejected") => {
    setProcessingRequest(requestId);

    try {
      const { error } = await supabase
        .from("activity_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (error) {
        console.error("Error updating request:", error);
        alert("Failed to update request. Please try again.");
      } else {
        alert(
          action === "accepted"
            ? "Request accepted!"
            : "Request rejected."
        );
        // Refresh requests
        await fetchRequests();
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  // Filter activities based on active tab
  const myActivities = activities.filter((a) => isOwnActivity(a.user_id));
  const otherActivities = activities.filter((a) => !isOwnActivity(a.user_id));
  const displayActivities = activeTab === "mine" ? myActivities : otherActivities;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium">Loading activities...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-150 h-150 bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-sky-50 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-6 py-3 flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <span className="text-lg font-bold text-slate-900">Outzy</span>
          </div>

          <button
            onClick={() => router.push("/create-activity")}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors font-medium"
          >
            <span>Create</span>
            <span className="text-lg">+</span>
          </button>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Activity Feed</h1>
          <p className="text-slate-600 mt-1">
            Discover activities happening near you
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-6 pb-4">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("others")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
              activeTab === "others"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              🔍 Discover
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {otherActivities.length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
              activeTab === "mine"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              ✨ My Activities
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                {myActivities.length}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        {displayActivities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
              {activeTab === "mine" ? "✨" : "📭"}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {activeTab === "mine" ? "No activities yet" : "No activities available"}
            </h3>
            <p className="text-slate-600 mb-6">
              {activeTab === "mine"
                ? "Create your first activity!"
                : "No activities from other users yet."}
            </p>
            <button
              onClick={() => router.push("/create-activity")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              {activeTab === "mine" ? "Create Activity" : "Create the first one!"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div
                key={activity.id}
                className={`bg-white border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${
                  isUpcoming(activity.activity_date)
                    ? "border-slate-200 hover:border-blue-300"
                    : "border-slate-100 opacity-60"
                }`}
              >
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {CATEGORY_LABELS[activity.category] || activity.category}
                  </span>
                  {!isUpcoming(activity.activity_date) && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      Past
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {activity.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  {activity.description}
                </p>

                {/* Host Info - Only show for others' activities */}
                {activeTab === "others" && (
                  <button
                    onClick={() => router.push(`/profile?userId=${activity.user_id}`)}
                    className="flex items-center gap-2 mb-4 hover:bg-slate-50 p-2 -m-2 rounded-lg transition-colors w-full text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {activity.host?.avatar_url ? (
                        <img
                          src={activity.host.avatar_url}
                          alt={activity.host.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        ( activity.host?.username)?.charAt(0).toUpperCase() || "?"
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">Hosted by</span>
                      <span className="text-sm font-semibold text-slate-900 hover:text-blue-600">
                        { activity.host?.username || "Unknown"}
                      </span>
                    </div>
                  </button>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">
                      📅
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(activity.activity_date)}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">
                      🕐
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Time</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatTime(activity.activity_date)}
                      </p>
                    </div>
                  </div>

                  {/* City */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">
                      📍
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">City</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {activity.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Members & Action */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-xs">
                      👥
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      <span className="font-bold text-slate-900">
                        {activity.max_people}
                      </span>{" "}
                      spots available
                    </span>
                  </div>

                  {/* Action Button */}
                  {activeTab === "others" ? (
                    isUpcoming(activity.activity_date) && (
                      <button
                        onClick={() => openRequestModal(activity)}
                        className="px-4 py-2 rounded-xl font-bold text-sm transition-all bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg"
                      >
                        Request to Join
                      </button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={openRequestsModal}
                        className="px-4 py-2 rounded-xl font-bold text-sm transition-all bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg"
                      >
                        View Requests
                      </button>
                      <button
                        onClick={() => router.push(`/activity/${activity.id}`)}
                        className="px-4 py-2 rounded-xl font-bold text-sm transition-all bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showModal && selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Request to Join
            </h3>
            <p className="text-slate-600 mb-4">
              You're requesting to join{" "}
              <span className="font-semibold">{selectedActivity.title}</span>{" "}
              by {selectedActivity.host?.username}
            </p>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Why do you want to join? *
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Tell the host a bit about yourself and why you'd like to join this activity..."
                rows={4}
                className="w-full border-2 border-slate-200 p-4 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sendingRequest}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {sendingRequest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests Modal (for host) */}
      {showRequestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowRequestsModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Join Requests
            </h3>

            {requests.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
                  📭
                </div>
                <p className="text-slate-600">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-slate-50 rounded-xl p-4"
                  >
                    {/* Requester Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {request.requester?.avatar_url ? (
                          <img
                            src={request.requester.avatar_url}
                            alt={request.requester.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          request.requester?.username?.charAt(0).toUpperCase() ||
                          "?"
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {request.requester?.username || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="text-sm text-slate-700">
                        "{request.message}"
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(request.id, "accepted")}
                        disabled={processingRequest === request.id}
                        className="flex-1 py-2 rounded-lg font-bold text-sm bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-70"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleRequest(request.id, "rejected")}
                        disabled={processingRequest === request.id}
                        className="flex-1 py-2 rounded-lg font-bold text-sm bg-red-100 hover:bg-red-200 text-red-700 transition-colors disabled:opacity-70"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowRequestsModal(false)}
              className="w-full mt-4 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}