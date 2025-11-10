
import { GoogleGenAI, Modality } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

const getAiClient = () => {
    // API key is automatically sourced from process.env.API_KEY
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const PROMPTS = [
  {
    angle: 'from the right',
    prompt: `You are an expert in virtual cinematography. Your task is to re-render an entire scene from a new camera position.

**Use this clock face analogy:** Imagine the subject is at the center of a clock. The original camera is at **6 o'clock**.

Your task is to move the camera **clockwise to the 3 o'clock position**. This creates a view of the subject's **right side profile**.

**CRITICAL INSTRUCTIONS:**
1.  **CAMERA MOVEMENT ONLY:** The camera orbits clockwise to 3 o'clock. The subject does NOT move, turn, or rotate in any way.
2.  **NEW BACKGROUND:** The background must change completely to show what is visible from the new 3 o'clock viewpoint. The original background (from 6 o'clock) is now out of the frame.
3.  **CONSISTENT LIGHTING:** The lighting must be consistent with the camera's new position. Any light source that was originally on the left of the subject (i.e., at 9 o'clock) is now positioned behind the subject relative to the new camera view. This should create realistic backlighting or rim lighting on the subject's profile.
4.  **SUBJECT FIDELITY:** The subject must be identical—same form, colors, textures—just viewed from this new 90-degree right-angle perspective.
5.  **COHESIVE SCENE:** The final image must be a single, photorealistic scene from the new 3 o'clock camera position.`
  },
  {
    angle: 'from the left',
    prompt: `You are an expert in virtual cinematography. Your task is to re-render an entire scene from a new camera position.

**Use this clock face analogy:** Imagine the subject is at the center of a clock. The original camera is at **6 o'clock**.

Your task is to move the camera **counter-clockwise to the 9 o'clock position**. This creates a view of the subject's **left side profile**.

**CRITICAL INSTRUCTIONS:**
1.  **CAMERA MOVEMENT ONLY:** The camera orbits counter-clockwise to 9 o'clock. The subject does NOT move, turn, or rotate in any way.
2.  **NEW BACKGROUND:** The background must change completely to show what is visible from the new 9 o'clock viewpoint. The original background (from 6 o'clock) is now out of the frame.
3.  **CONSISTENT LIGHTING:** The lighting must be consistent with the camera's new position. Any light source that was originally on the right of the subject (i.e., at 3 o'clock) is now positioned behind the subject relative to the new camera view. This should create realistic backlighting or rim lighting on the subject's profile.
4.  **SUBJECT FIDELITY:** The subject must be identical—same form, colors, textures—just viewed from this new 90-degree left-angle perspective.
5.  **COHESIVE SCENE:** The final image must be a single, photorealistic scene from the new 9 o'clock camera position.`
  },
  {
    angle: 'from behind',
    prompt: `You are an expert virtual cinematographer. Your task is to re-render a scene from a new camera position. **The most important rule is: The camera moves, the subject and the scene do NOT move or rotate.**

Generate a new, photorealistic image of the exact same scene, but as if you walked 180 degrees around the subject to view it **from directly behind**.

**ABSOLUTELY CRITICAL INSTRUCTIONS:**
1.  **NO OBJECT ROTATION:** Do NOT rotate, mirror, or turn the subject. The subject remains perfectly still. You are changing your point of view, not altering the subject's orientation.
2.  **CAMERA MOVEMENT ONLY:** The camera has physically moved to the back of the scene. You are looking at the subject's back.
3.  **NEW BACKGROUND IS KEY:** Because the camera has moved, the background MUST be completely different. The new background should be a logical and plausible continuation of the environment shown in the original image. For example, if the subject was in a forest, the new background is more of that forest from the opposite perspective. The original background is now completely out of frame.
4.  **REVERSED LIGHTING:** The lighting must be consistent with the new camera position. If the subject was lit from the front in the original image, it must now be lit from behind (backlit). This should create a strong rim light or silhouette effect, as the main light source is now pointing towards the camera.
5.  **MAINTAIN SUBJECT INTEGRITY:** The subject itself must be identical in form, color, and texture, but shown from the new rear-view perspective.
6.  **COHESIVE SCENE:** The final image must look like a single, realistic photograph taken from this new position behind the subject.`
  },
  {
    angle: 'from above',
    prompt: `You are an expert in virtual cinematography. Your task is to re-render an entire scene from a different camera position based on a single source image.

The camera is moving, not the subject.

Generate a new, photorealistic image of the exact same scene, but with the camera positioned **directly above the subject, pointing straight down (a bird's-eye view)**.

Critical instructions:
1.  **Camera Perspective:** This is a top-down shot. The subject has not moved.
2.  **Dynamic Background:** The 'background' is now the surface the subject is on (floor, ground, table, etc.) and its immediate surroundings as seen from above. The original vertical background is no longer in the frame.
3.  **Subject Fidelity:** The subject must be identical, with no changes to its form, features, textures, or colors, just viewed from this high angle.
4.  **Consistent Lighting:** The lighting must be consistent with the original light sources, now illuminating the top surfaces of the subject. Shadows should be cast on the ground plane below.
5.  **Scene Cohesion:** The entire image must look like a coherent scene captured from a single, new camera position.`
  }
];

async function generateSingleImage(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  const ai = getAiClient();
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64Bytes = part.inlineData.data;
      const imageMimeType = part.inlineData.mimeType;
      return `data:${imageMimeType};base64,${base64Bytes}`;
    }
  }

  throw new Error(`Image generation failed for prompt: "${prompt}"`);
}

export const generateImageViews = async (base64Image: string, mimeType: string): Promise<string[]> => {
  const imagePromises = PROMPTS.map(p => generateSingleImage(base64Image, mimeType, p.prompt));
  
  const results = await Promise.allSettled(imagePromises);

  const successfulImages = results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<string>).value);
  
  if (successfulImages.length === 0) {
    const firstError = results.find(result => result.status === 'rejected') as PromiseRejectedResult | undefined;
    throw new Error(firstError?.reason?.message || "All image generation requests failed.");
  }
  
  return successfulImages;
};
