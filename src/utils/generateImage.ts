import openai from '../config/openai';

export interface ImageGenerationOptions {
  style: 'natural' | 'cartoon' | 'artistic' | 'diagram' | 'infographic';
  size: '256x256' | '512x512' | '1024x1024';
  quality: 'standard' | 'hd';
}

export const generateImage = async (
  prompt: string,
  options: ImageGenerationOptions = {
    style: 'natural',
    size: '512x512',
    quality: 'standard'
  }
): Promise<{
  imageUrl: string;
  revisedPrompt?: string;
}> => {
  try {
    const styleModifiers = {
      natural: 'photorealistic, natural lighting',
      cartoon: 'cartoon style, colorful, friendly',
      artistic: 'artistic illustration, creative, expressive',
      diagram: 'clean diagram, educational, clear labels',
      infographic: 'infographic style, data visualization, professional'
    };

    const enhancedPrompt = `${prompt}, ${styleModifiers[options.style]}, high quality, educational content`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: options.size,
      quality: options.quality,
      response_format: 'url'
    });
      const image = await openai.images.generate({
  model: "dall-e-3",
  prompt: enhancedPrompt,
  n: 1,
  size: options.size,
  quality: options.quality,
  response_format: 'url'
});

if (!image.data || image.data.length === 0) {
  throw new Error('No image data returned from OpenAI');
}

return {
  imageUrl: image.data[0].url!,
  revisedPrompt: image.data[0].revised_prompt
};


    // return {
    //   imageUrl: response.data[0].url!,
    //   revisedPrompt: response.data[0].revised_prompt
    // };
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image');
  }
};
