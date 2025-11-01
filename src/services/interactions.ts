import { API_ENDPOINT } from "src/config";

/**
 * Increment the view count for a clip
 * This should be called once when a user starts watching a clip
 */
export async function incrementView(clipId: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/clip/${clipId}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (!res.ok) {
      console.error("Failed to increment view:", await res.text());
    }
  } catch (error) {
    console.error("Error incrementing view:", error);
  }
}

/**
 * Like a clip
 * Requires authentication
 */
export async function likeClip(
  clipId: string,
  accessToken: string,
): Promise<{ success: boolean; likes?: number; error?: string }> {
  try {
    const res = await fetch(`${API_ENDPOINT}/clip/${clipId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Failed to like clip",
      };
    }

    return {
      success: true,
      likes: data.likes,
    };
  } catch (error) {
    console.error("Error liking clip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Unlike a clip
 * Requires authentication
 */
export async function unlikeClip(
  clipId: string,
  accessToken: string,
): Promise<{ success: boolean; likes?: number; error?: string }> {
  try {
    const res = await fetch(`${API_ENDPOINT}/clip/${clipId}/like`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Failed to unlike clip",
      };
    }

    return {
      success: true,
      likes: data.likes,
    };
  } catch (error) {
    console.error("Error unliking clip:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if the current user has liked a specific clip
 * This is a client-side helper that will need to track state
 */
// export async function checkIfLiked(
//   clipId: string,
//   accessToken: string,
// ): Promise<boolean> {
//   // This would ideally be an API call to check the UserLikesTable
//   // For now, we'll need to track this client-side or add a new endpoint
//   // Returning false as default for now
//   return false;
// }
