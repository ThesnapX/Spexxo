// frontend/src/utils/docxImporter.js

import mammoth from "mammoth";
import { htmlToBlocks } from "./htmlToBlocks";

/**
 * Convert a .docx File → blocks array
 * @param {File} file
 * @returns {Promise<Array>} blocks
 */
export const docxToBlocks = async (file) => {
  const arrayBuffer = await file.arrayBuffer();

  // mammoth will inline images as data URIs
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement((image) => {
        return image.read("base64").then((imageBuffer) => {
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`,
          };
        });
      }),
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Intense Quote'] => blockquote:fresh",
      ],
    },
  );

  // result.value = HTML string
  return htmlToBlocks(result.value);
};
