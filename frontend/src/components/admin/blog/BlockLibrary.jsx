// frontend/src/components/admin/blog/BlockLibrary.jsx

import {
  Bars3BottomLeftIcon,
  PhotoIcon,
  Squares2X2Icon,
  ChatBubbleBottomCenterTextIcon,
  MinusIcon,
  ArrowsUpDownIcon,
  ListBulletIcon,
  CursorArrowRaysIcon,
  VideoCameraIcon,
  TableCellsIcon,
  CodeBracketIcon,
  MegaphoneIcon,
  RectangleGroupIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";

const BLOCKS = [
  {
    type: "heading",
    label: "Heading",
    icon: Bars3BottomLeftIcon,
    category: "Text",
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: Bars3BottomLeftIcon,
    category: "Text",
  },
  { type: "list", label: "List", icon: ListBulletIcon, category: "Text" },
  {
    type: "quote",
    label: "Quote",
    icon: ChatBubbleBottomCenterTextIcon,
    category: "Text",
  },
  { type: "callout", label: "Callout", icon: MegaphoneIcon, category: "Text" },
  { type: "image", label: "Image", icon: PhotoIcon, category: "Media" },
  {
    type: "image-text",
    label: "Image + Text",
    icon: RectangleGroupIcon,
    category: "Media",
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: Squares2X2Icon,
    category: "Media",
  },
  {
    type: "embed",
    label: "Video Embed",
    icon: VideoCameraIcon,
    category: "Media",
  },
  {
    type: "two-column",
    label: "Two Column",
    icon: ViewColumnsIcon,
    category: "Layout",
  },
  { type: "divider", label: "Divider", icon: MinusIcon, category: "Layout" },
  {
    type: "spacer",
    label: "Spacer",
    icon: ArrowsUpDownIcon,
    category: "Layout",
  },
  { type: "table", label: "Table", icon: TableCellsIcon, category: "Advanced" },
  { type: "code", label: "Code", icon: CodeBracketIcon, category: "Advanced" },
  {
    type: "button",
    label: "Button / CTA",
    icon: CursorArrowRaysIcon,
    category: "Advanced",
  },
];

const BlockLibrary = ({ onAddBlock }) => {
  const grouped = BLOCKS.reduce((acc, b) => {
    (acc[b.category] = acc[b.category] || []).push(b);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-100 h-full flex flex-col">
      <div className="p-4 border-b">
        <p className="text-xs text-text-light uppercase tracking-wider">
          Add Blocks
        </p>
        <h3 className="text-sm font-semibold text-text">Block Library</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(grouped).map(([category, blocks]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2 px-1">
              {category}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {blocks.map((b) => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => onAddBlock(b.type)}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-[#EBF4FC] transition text-center"
                  >
                    <Icon className="w-5 h-5 text-gray-500" />
                    <span className="text-xs font-medium text-text">
                      {b.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockLibrary;
