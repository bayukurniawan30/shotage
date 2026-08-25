import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Copy01, Trash01 } from '@untitledui/icons';
import { Toggle } from '../Toggle';
import { PhosphorWeight, PhosphorBadgeStyle } from '../../types/studio';

export const PhosphorIconsSection: React.FC = () => {
  const state = useStudioStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeOption, setActiveOption] = useState<'size' | 'position' | 'rotation' | 'opacity'>('size');

  const iconLayers = state.phosphorIconLayers || [];
  const selectedLayer = iconLayers.find((l) => l.id === state.selectedPhosphorIconLayerId);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'ui', label: 'UI & Web' },
    { id: 'shapes', label: 'Shapes' },
    { id: 'arrows', label: 'Arrows' },
    { id: 'brands', label: 'Brands' },
    { id: 'social', label: 'Social' },
    { id: 'maps', label: 'Maps' },
    { id: 'tech', label: 'Tech' },
    { id: 'media', label: 'Media' },
    { id: 'commerce', label: 'Commerce' },
  ];

  const phosphorIconItems: { id: string; label: string; category: string }[] = [
    // UI & Web (including Bookmarks!)
    { id: 'Bookmark', label: 'Bookmark', category: 'ui' },
    { id: 'BookmarkSimple', label: 'Simple Bookmark', category: 'ui' },
    { id: 'Bookmarks', label: 'Bookmarks', category: 'ui' },
    { id: 'Gear', label: 'Gear', category: 'ui' },
    { id: 'Sliders', label: 'Sliders', category: 'ui' },
    { id: 'Funnel', label: 'Filter', category: 'ui' },
    { id: 'MagnifyingGlass', label: 'Search', category: 'ui' },
    { id: 'Check', label: 'Check', category: 'ui' },
    { id: 'X', label: 'Close', category: 'ui' },
    { id: 'Plus', label: 'Plus', category: 'ui' },
    { id: 'LockKey', label: 'Lock', category: 'ui' },
    { id: 'Key', label: 'Key', category: 'ui' },
    { id: 'Trash', label: 'Trash', category: 'ui' },
    { id: 'PencilSimple', label: 'Edit', category: 'ui' },
    { id: 'Copy', label: 'Copy', category: 'ui' },
    { id: 'Share', label: 'Share', category: 'ui' },
    { id: 'DownloadSimple', label: 'Download', category: 'ui' },

    // Shapes & Badges
    { id: 'Sparkle', label: 'Sparkle', category: 'shapes' },
    { id: 'Star', label: 'Star', category: 'shapes' },
    { id: 'Heart', label: 'Heart', category: 'shapes' },
    { id: 'Lightning', label: 'Lightning', category: 'shapes' },
    { id: 'Fire', label: 'Fire', category: 'shapes' },
    { id: 'Cube', label: 'Cube', category: 'shapes' },
    { id: 'Circle', label: 'Circle', category: 'shapes' },
    { id: 'Square', label: 'Square', category: 'shapes' },
    { id: 'Triangle', label: 'Triangle', category: 'shapes' },
    { id: 'Polygon', label: 'Polygon', category: 'shapes' },
    { id: 'Diamond', label: 'Diamond', category: 'shapes' },
    { id: 'ShieldCheck', label: 'Shield', category: 'shapes' },
    { id: 'SealCheck', label: 'Seal Check', category: 'shapes' },
    { id: 'Crown', label: 'Crown', category: 'shapes' },
    { id: 'Planet', label: 'Planet', category: 'shapes' },

    // Arrows (Direction, Carets, Chevrons & Variations)
    { id: 'ArrowUp', label: 'Arrow Up', category: 'arrows' },
    { id: 'ArrowDown', label: 'Arrow Down', category: 'arrows' },
    { id: 'ArrowLeft', label: 'Arrow Left', category: 'arrows' },
    { id: 'ArrowRight', label: 'Arrow Right', category: 'arrows' },
    { id: 'ArrowUpRight', label: 'Arrow Up Right', category: 'arrows' },
    { id: 'ArrowUpLeft', label: 'Arrow Up Left', category: 'arrows' },
    { id: 'ArrowDownRight', label: 'Arrow Down Right', category: 'arrows' },
    { id: 'ArrowDownLeft', label: 'Arrow Down Left', category: 'arrows' },
    { id: 'ArrowCircleUp', label: 'Circle Up', category: 'arrows' },
    { id: 'ArrowCircleDown', label: 'Circle Down', category: 'arrows' },
    { id: 'ArrowCircleLeft', label: 'Circle Left', category: 'arrows' },
    { id: 'ArrowCircleRight', label: 'Circle Right', category: 'arrows' },
    { id: 'ArrowSquareUp', label: 'Square Up', category: 'arrows' },
    { id: 'ArrowSquareDown', label: 'Square Down', category: 'arrows' },
    { id: 'ArrowSquareLeft', label: 'Square Left', category: 'arrows' },
    { id: 'ArrowSquareRight', label: 'Square Right', category: 'arrows' },
    { id: 'ArrowLineUp', label: 'Line Up', category: 'arrows' },
    { id: 'ArrowLineDown', label: 'Line Down', category: 'arrows' },
    { id: 'ArrowLineLeft', label: 'Line Left', category: 'arrows' },
    { id: 'ArrowLineRight', label: 'Line Right', category: 'arrows' },
    { id: 'ArrowFatUp', label: 'Fat Up', category: 'arrows' },
    { id: 'ArrowFatDown', label: 'Fat Down', category: 'arrows' },
    { id: 'ArrowFatLeft', label: 'Fat Left', category: 'arrows' },
    { id: 'ArrowFatRight', label: 'Fat Right', category: 'arrows' },
    { id: 'ArrowClockwise', label: 'Clockwise', category: 'arrows' },
    { id: 'ArrowCounterClockwise', label: 'Counter Clockwise', category: 'arrows' },
    { id: 'ArrowBendUpRight', label: 'Bend Up Right', category: 'arrows' },
    { id: 'ArrowBendUpLeft', label: 'Bend Up Left', category: 'arrows' },
    { id: 'ArrowBendDownRight', label: 'Bend Down Right', category: 'arrows' },
    { id: 'ArrowBendDownLeft', label: 'Bend Down Left', category: 'arrows' },
    { id: 'ArrowUDownLeft', label: 'U-Turn Left', category: 'arrows' },
    { id: 'ArrowUDownRight', label: 'U-Turn Right', category: 'arrows' },
    { id: 'ArrowElbowUpRight', label: 'Elbow Up Right', category: 'arrows' },
    { id: 'ArrowElbowUpLeft', label: 'Elbow Up Left', category: 'arrows' },
    { id: 'ArrowElbowDownRight', label: 'Elbow Down Right', category: 'arrows' },
    { id: 'ArrowElbowDownLeft', label: 'Elbow Down Left', category: 'arrows' },
    { id: 'CaretUp', label: 'Caret Up', category: 'arrows' },
    { id: 'CaretDown', label: 'Caret Down', category: 'arrows' },
    { id: 'CaretLeft', label: 'Caret Left', category: 'arrows' },
    { id: 'CaretRight', label: 'Caret Right', category: 'arrows' },
    { id: 'CaretDoubleUp', label: 'Caret Double Up', category: 'arrows' },
    { id: 'CaretDoubleDown', label: 'Caret Double Down', category: 'arrows' },
    { id: 'CaretDoubleLeft', label: 'Caret Double Left', category: 'arrows' },
    { id: 'CaretDoubleRight', label: 'Caret Double Right', category: 'arrows' },
    { id: 'CaretCircleUp', label: 'Caret Circle Up', category: 'arrows' },
    { id: 'CaretCircleDown', label: 'Caret Circle Down', category: 'arrows' },
    { id: 'CaretCircleLeft', label: 'Caret Circle Left', category: 'arrows' },
    { id: 'CaretCircleRight', label: 'Caret Circle Right', category: 'arrows' },
    { id: 'CaretCircleDoubleUp', label: 'Caret Circle Dbl Up', category: 'arrows' },
    { id: 'CaretCircleDoubleDown', label: 'Caret Circle Dbl Down', category: 'arrows' },
    { id: 'CaretCircleDoubleLeft', label: 'Caret Circle Dbl Left', category: 'arrows' },
    { id: 'CaretCircleDoubleRight', label: 'Caret Circle Dbl Right', category: 'arrows' },
    { id: 'ArrowsClockwise', label: 'Arrows Spin CW', category: 'arrows' },
    { id: 'ArrowsCounterClockwise', label: 'Arrows Spin CCW', category: 'arrows' },
    { id: 'ArrowsLeftRight', label: 'Left Right', category: 'arrows' },
    { id: 'ArrowsDownUp', label: 'Down Up', category: 'arrows' },
    { id: 'ArrowsHorizontal', label: 'Horizontal', category: 'arrows' },
    { id: 'ArrowsVertical', label: 'Vertical', category: 'arrows' },
    { id: 'ArrowsIn', label: 'Arrows In', category: 'arrows' },
    { id: 'ArrowsOut', label: 'Arrows Out', category: 'arrows' },
    { id: 'ArrowsInSimple', label: 'Arrows In Simple', category: 'arrows' },
    { id: 'ArrowsOutSimple', label: 'Arrows Out Simple', category: 'arrows' },
    { id: 'ArrowsMerge', label: 'Arrows Merge', category: 'arrows' },
    { id: 'ArrowsSplit', label: 'Arrows Split', category: 'arrows' },
    { id: 'Swap', label: 'Swap', category: 'arrows' },
    { id: 'Shuffle', label: 'Shuffle', category: 'arrows' },
    { id: 'Repeat', label: 'Repeat', category: 'arrows' },

    // Tech & Dev
    { id: 'Code', label: 'Code', category: 'tech' },
    { id: 'TerminalWindow', label: 'Terminal', category: 'tech' },
    { id: 'Cpu', label: 'CPU', category: 'tech' },
    { id: 'Database', label: 'Database', category: 'tech' },
    { id: 'GitBranch', label: 'Git Branch', category: 'tech' },
    { id: 'Cloud', label: 'Cloud', category: 'tech' },
    { id: 'Bug', label: 'Bug', category: 'tech' },
    { id: 'Desktop', label: 'Desktop', category: 'tech' },
    { id: 'Laptop', label: 'Laptop', category: 'tech' },
    { id: 'DeviceMobile', label: 'Mobile', category: 'tech' },
    { id: 'WifiHigh', label: 'Wi-Fi', category: 'tech' },
    { id: 'Broadcast', label: 'Broadcast', category: 'tech' },

    // Media
    { id: 'Image', label: 'Image', category: 'media' },
    { id: 'VideoCamera', label: 'Video', category: 'media' },
    { id: 'MusicNotes', label: 'Music', category: 'media' },
    { id: 'Microphone', label: 'Mic', category: 'media' },
    { id: 'Camera', label: 'Camera', category: 'media' },
    { id: 'Play', label: 'Play', category: 'media' },
    { id: 'Pause', label: 'Pause', category: 'media' },
    { id: 'Folder', label: 'Folder', category: 'media' },
    { id: 'FileCode', label: 'File Code', category: 'media' },

    // Commerce
    { id: 'ShoppingCart', label: 'Cart', category: 'commerce' },
    { id: 'ShoppingBag', label: 'Bag', category: 'commerce' },
    { id: 'CreditCard', label: 'Card', category: 'commerce' },
    { id: 'Tag', label: 'Tag', category: 'commerce' },
    { id: 'Receipt', label: 'Receipt', category: 'commerce' },
    { id: 'TrendUp', label: 'Trend Up', category: 'commerce' },
    { id: 'Percent', label: 'Percent', category: 'commerce' },
    { id: 'Gift', label: 'Gift', category: 'commerce' },
    { id: 'Trophy', label: 'Trophy', category: 'commerce' },
    { id: 'Bank', label: 'Bank', category: 'commerce' },

    // Brands & Logos
    { id: 'MetaLogo', label: 'Meta', category: 'brands' },
    { id: 'OpenAiLogo', label: 'OpenAI', category: 'brands' },
    { id: 'XLogo', label: 'X', category: 'brands' },
    { id: 'ThreadsLogo', label: 'Threads', category: 'brands' },
    { id: 'AmazonLogo', label: 'Amazon', category: 'brands' },
    { id: 'AppStoreLogo', label: 'App Store', category: 'brands' },
    { id: 'AngularLogo', label: 'Angular', category: 'brands' },
    { id: 'GoogleChromeLogo', label: 'Chrome', category: 'brands' },
    { id: 'CodaLogo', label: 'Coda', category: 'brands' },
    { id: 'CodepenLogo', label: 'CodePen', category: 'brands' },
    { id: 'CodesandboxLogo', label: 'CodeSandbox', category: 'brands' },
    { id: 'DevToLogo', label: 'Dev.to', category: 'brands' },
    { id: 'DropboxLogo', label: 'Dropbox', category: 'brands' },
    { id: 'FediverseLogo', label: 'Fediverse', category: 'brands' },
    { id: 'FramerLogo', label: 'Framer', category: 'brands' },
    { id: 'GitlabLogo', label: 'GitLab', category: 'brands' },
    { id: 'GitlabLogoSimple', label: 'GitLab Simple', category: 'brands' },
    { id: 'GoodreadsLogo', label: 'Goodreads', category: 'brands' },
    { id: 'GoogleDriveLogo', label: 'Google Drive', category: 'brands' },
    { id: 'GooglePhotosLogo', label: 'Google Photos', category: 'brands' },
    { id: 'GooglePlayLogo', label: 'Google Play', category: 'brands' },
    { id: 'LastfmLogo', label: 'Last.fm', category: 'brands' },
    { id: 'LinktreeLogo', label: 'Linktree', category: 'brands' },
    { id: 'LinuxLogo', label: 'Linux', category: 'brands' },
    { id: 'MarkdownLogo', label: 'Markdown', category: 'brands' },
    { id: 'MastodonLogo', label: 'Mastodon', category: 'brands' },
    { id: 'MatrixLogo', label: 'Matrix', category: 'brands' },
    { id: 'MessengerLogo', label: 'Messenger', category: 'brands' },
    { id: 'MicrosoftExcelLogo', label: 'MS Excel', category: 'brands' },
    { id: 'MicrosoftOutlookLogo', label: 'MS Outlook', category: 'brands' },
    { id: 'MicrosoftPowerpointLogo', label: 'MS PowerPoint', category: 'brands' },
    { id: 'MicrosoftTeamsLogo', label: 'MS Teams', category: 'brands' },
    { id: 'MicrosoftWordLogo', label: 'MS Word', category: 'brands' },
    { id: 'NotionLogo', label: 'Notion', category: 'brands' },
    { id: 'NyTimesLogo', label: 'NY Times', category: 'brands' },
    { id: 'PatreonLogo', label: 'Patreon', category: 'brands' },
    { id: 'PaypalLogo', label: 'PayPal', category: 'brands' },
    { id: 'PhosphorLogo', label: 'Phosphor', category: 'brands' },
    { id: 'PixLogo', label: 'Pix', category: 'brands' },
    { id: 'ReadCvLogo', label: 'Read.cv', category: 'brands' },
    { id: 'ReplitLogo', label: 'Replit', category: 'brands' },
    { id: 'SketchLogo', label: 'Sketch', category: 'brands' },
    { id: 'SkypeLogo', label: 'Skype', category: 'brands' },
    { id: 'SoundcloudLogo', label: 'SoundCloud', category: 'brands' },
    { id: 'SquareLogo', label: 'Square', category: 'brands' },
    { id: 'StackOverflowLogo', label: 'Stack Overflow', category: 'brands' },
    { id: 'SteamLogo', label: 'Steam', category: 'brands' },
    { id: 'StripeLogo', label: 'Stripe', category: 'brands' },
    { id: 'TidalLogo', label: 'Tidal', category: 'brands' },
    { id: 'TumblrLogo', label: 'Tumblr', category: 'brands' },
    { id: 'WebhooksLogo', label: 'Webhooks', category: 'brands' },
    { id: 'WechatLogo', label: 'WeChat', category: 'brands' },
    { id: 'WindowsLogo', label: 'Windows', category: 'brands' },

    // Social, Brands & Chat
    { id: 'TwitterLogo', label: 'X / Twitter', category: 'social' },
    { id: 'InstagramLogo', label: 'Instagram', category: 'social' },
    { id: 'FacebookLogo', label: 'Facebook', category: 'social' },
    { id: 'YoutubeLogo', label: 'YouTube', category: 'social' },
    { id: 'TiktokLogo', label: 'TikTok', category: 'social' },
    { id: 'LinkedinLogo', label: 'LinkedIn', category: 'social' },
    { id: 'GithubLogo', label: 'GitHub', category: 'social' },
    { id: 'DribbbleLogo', label: 'Dribbble', category: 'social' },
    { id: 'FigmaLogo', label: 'Figma', category: 'social' },
    { id: 'BehanceLogo', label: 'Behance', category: 'social' },
    { id: 'DiscordLogo', label: 'Discord', category: 'social' },
    { id: 'TelegramLogo', label: 'Telegram', category: 'social' },
    { id: 'WhatsappLogo', label: 'WhatsApp', category: 'social' },
    { id: 'RedditLogo', label: 'Reddit', category: 'social' },
    { id: 'TwitchLogo', label: 'Twitch', category: 'social' },
    { id: 'SpotifyLogo', label: 'Spotify', category: 'social' },
    { id: 'PinterestLogo', label: 'Pinterest', category: 'social' },
    { id: 'MediumLogo', label: 'Medium', category: 'social' },
    { id: 'SlackLogo', label: 'Slack', category: 'social' },
    { id: 'SnapchatLogo', label: 'Snapchat', category: 'social' },
    { id: 'GoogleLogo', label: 'Google', category: 'social' },
    { id: 'AppleLogo', label: 'Apple', category: 'social' },
    { id: 'AndroidLogo', label: 'Android', category: 'social' },
    { id: 'ChatCircleText', label: 'Chat', category: 'social' },
    { id: 'Envelope', label: 'Email', category: 'social' },
    { id: 'ShareNetwork', label: 'Network', category: 'social' },
    { id: 'ThumbsUp', label: 'Like', category: 'social' },
    { id: 'User', label: 'User', category: 'social' },
    { id: 'Users', label: 'Users', category: 'social' },
    { id: 'Globe', label: 'Globe', category: 'social' },

    // Maps & Location
    { id: 'MapTrifold', label: 'Map', category: 'maps' },
    { id: 'MapPin', label: 'Map Pin', category: 'maps' },
    { id: 'MapPinArea', label: 'Map Pin Area', category: 'maps' },
    { id: 'MapPinLine', label: 'Map Pin Line', category: 'maps' },
    { id: 'MapPinPlus', label: 'Map Pin Plus', category: 'maps' },
    { id: 'MapPinSimple', label: 'Map Pin Simple', category: 'maps' },
    { id: 'MapPinSimpleArea', label: 'Pin Area', category: 'maps' },
    { id: 'MapPinSimpleLine', label: 'Pin Line', category: 'maps' },
    { id: 'NavigationArrow', label: 'Navigation', category: 'maps' },
  ];

  const filteredItems = phosphorIconItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const weights: { id: PhosphorWeight; label: string }[] = [
    { id: 'regular', label: 'Regular' },
    { id: 'fill', label: 'Fill' },
    { id: 'duotone', label: 'Duotone' },
  ];

  const badgeStyles: { id: PhosphorBadgeStyle; label: string }[] = [
    { id: 'plain', label: 'Plain' },
    { id: 'glass-dark', label: 'Glass Dark' },
    { id: 'glass-light', label: 'Glass Light' },
    { id: 'badge-dark', label: 'Solid Dark' },
    { id: 'badge-light', label: 'Solid Light' },
    { id: 'circle-dark', label: 'Circle Dark' },
    { id: 'circle-light', label: 'Circle Light' },
  ];

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      {/* Header */}
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhosphorIcons.SparkleIcon weight="regular" className="w-4 h-4 text-pastel-pink" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Icons by Phosphor
          </h3>
        </div>
      </div>

      {/* Catalog Search & Add Icon Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Icon Catalog (Click to Add)</span>
          <span className="font-mono text-[10px] text-pastel-pink">
            {iconLayers.length} on stage
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg shrink-0 border transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-pastel-blue font-bold'
                  : 'bg-neutral-900 border-neutral-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search icons (e.g. Bookmark, Heart, Code)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pastel-pink"
        />

        {/* Icon Grid Picker */}
        <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-2 bg-neutral-950 rounded-xl border border-neutral-800 no-scrollbar">
          {filteredItems.map((item) => {
            const IconComp = (PhosphorIcons as any)[item.id] || PhosphorIcons.SparkleIcon;
            return (
              <button
                key={`${item.category}-${item.id}`}
                type="button"
                title={`Click to add ${item.label}`}
                onClick={() => state.addPhosphorIconLayer(item.id)}
                className="p-2 rounded-lg border bg-neutral-900/60 border-neutral-800/80 text-slate-300 hover:border-pastel-pink/60 hover:text-white hover:bg-pastel-pink/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
              >
                <IconComp
                  weight="regular"
                  size={20}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="text-[9px] font-medium mt-1 truncate max-w-full text-slate-400 group-hover:text-slate-200">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Existing Canvas Icon Layers List */}
      {iconLayers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-800/80">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Canvas Icon Layers ({iconLayers.length})
          </label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
            {iconLayers.map((layer, index) => {
              const isSelected = layer.id === state.selectedPhosphorIconLayerId;
              const IconComp = (PhosphorIcons as any)[layer.iconId] || PhosphorIcons.SparkleIcon;
              return (
                <div
                  key={layer.id}
                  onClick={() => state.selectPhosphorIconLayer(layer.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-pastel-pink/15 border-pastel-pink text-white font-bold'
                      : 'bg-neutral-900/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-6 h-6 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                      <IconComp
                        weight={layer.weight || 'regular'}
                        size={14}
                        color={layer.color || '#a2d2ff'}
                      />
                    </div>
                    <span className="text-xs truncate">
                      {layer.iconId} #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-slate-400">
                      {layer.position === 'underneath' ? 'Behind' : 'Above'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.duplicatePhosphorIconLayer(layer.id);
                      }}
                      title="Duplicate icon"
                      className="p-1 hover:text-pastel-pink text-slate-400 transition-colors cursor-pointer"
                    >
                      <Copy01 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.removePhosphorIconLayer(layer.id);
                      }}
                      title="Delete icon"
                      className="p-1 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
                    >
                      <Trash01 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Icon Layer Editor Controls */}
      {selectedLayer && (
        <div className="space-y-4 pt-3 border-t border-neutral-800/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Editing: {selectedLayer.iconId}</span>
            <button
              type="button"
              onClick={() => state.selectPhosphorIconLayer(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Deselect
            </button>
          </div>

          {/* Icon Weight Switcher */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Icon Style / Weight
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {weights.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() =>
                    state.updatePhosphorIconLayer(selectedLayer.id, { weight: w.id })
                  }
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    (selectedLayer.weight || 'regular') === w.id
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink shadow-xs'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Shadow Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] font-semibold text-slate-300">Drop Shadow</label>
            <Toggle
              isSelected={!!selectedLayer.shadow}
              onChange={(checked) =>
                state.updatePhosphorIconLayer(selectedLayer.id, { shadow: checked })
              }
              size="sm"
            />
          </div>

          {/* Layering Depth (Above vs Behind Mockup) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Layering Depth
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  state.updatePhosphorIconLayer(selectedLayer.id, { position: 'above' })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  (selectedLayer.position || 'above') === 'above'
                    ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Above Mockup
              </button>
              <button
                type="button"
                onClick={() =>
                  state.updatePhosphorIconLayer(selectedLayer.id, { position: 'underneath' })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  selectedLayer.position === 'underneath'
                    ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Behind Mockup
              </button>
            </div>
          </div>

          {/* Container Style Switcher (includes Circle Dark & Circle Light!) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Container Style
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {badgeStyles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    state.updatePhosphorIconLayer(selectedLayer.id, { badgeStyle: b.id })
                  }
                  className={`py-1.5 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer truncate text-center ${
                    (selectedLayer.badgeStyle || 'circle-dark') === b.id
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink shadow-xs'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Color Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Icon Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedLayer.color || '#a2d2ff'}
                onChange={(e) =>
                  state.updatePhosphorIconLayer(selectedLayer.id, { color: e.target.value })
                }
                className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={selectedLayer.color || '#a2d2ff'}
                onChange={(e) =>
                  state.updatePhosphorIconLayer(selectedLayer.id, { color: e.target.value })
                }
                className="flex-1 bg-neutral-900 border border-neutral-800 text-xs font-mono rounded-lg px-2.5 py-1 text-slate-200"
              />
            </div>
          </div>

          {/* Phosphor Icon Transform & Adjustment Circle Buttons */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Transform & Adjustments
              </span>
              <span className="text-[10px] text-pastel-pink font-semibold capitalize">
                {activeOption === 'opacity' ? 'Opacity' : activeOption}
              </span>
            </div>

            {/* Circle Buttons Row with Tooltips */}
            <div className="flex items-center gap-1.5 py-1 flex-wrap">
              {[
                {
                  id: 'size',
                  label: 'Size',
                  tooltip: 'Icon Size',
                  icon: (
                    <PhosphorIcons.BoundingBoxIcon
                      weight={activeOption === 'size' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'position',
                  label: 'Position',
                  tooltip: 'Position (X / Y)',
                  icon: (
                    <PhosphorIcons.ArrowsOutCardinalIcon
                      weight={activeOption === 'position' ? 'bold' : 'regular'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'rotation',
                  label: 'Rotation',
                  tooltip: 'Rotation Angle',
                  icon: (
                    <PhosphorIcons.ArrowsClockwiseIcon
                      weight={activeOption === 'rotation' ? 'bold' : 'regular'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'opacity',
                  label: 'Opacity',
                  tooltip: 'Layer Opacity',
                  icon: (
                    <PhosphorIcons.SunDimIcon
                      weight={activeOption === 'opacity' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
              ].map((btn) => {
                const isActive = activeOption === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setActiveOption(btn.id as any)}
                    title={btn.tooltip}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                      isActive
                        ? 'animate-border shadow-md shadow-pink-300/30 scale-105 text-pastel-pink'
                        : 'bg-neutral-900 text-slate-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {btn.icon}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Slider Container with smooth transition */}
            <div className="pt-1 space-y-3 animate-in fade-in duration-150">
              {/* Option: Size */}
              {activeOption === 'size' && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Icon Size</span>
                    <span className="font-mono text-slate-400">{selectedLayer.size || 40}px</span>
                  </div>
                  <input
                    type="range"
                    min={16}
                    max={120}
                    value={selectedLayer.size || 40}
                    onChange={(e) =>
                      state.updatePhosphorIconLayer(selectedLayer.id, {
                        size: Number(e.target.value),
                      })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              )}

              {/* Option: Position */}
              {activeOption === 'position' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Position X</span>
                      <span className="font-mono text-slate-400">{selectedLayer.x || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min={-400}
                      max={400}
                      value={selectedLayer.x || 0}
                      onChange={(e) =>
                        state.updatePhosphorIconLayer(selectedLayer.id, {
                          x: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Position Y</span>
                      <span className="font-mono text-slate-400">{selectedLayer.y || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min={-400}
                      max={400}
                      value={selectedLayer.y || 0}
                      onChange={(e) =>
                        state.updatePhosphorIconLayer(selectedLayer.id, {
                          y: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              )}

              {/* Option: Rotation */}
              {activeOption === 'rotation' && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Rotation</span>
                    <span className="font-mono text-slate-400">
                      {selectedLayer.rotation || 0}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedLayer.rotation || 0}
                    onChange={(e) =>
                      state.updatePhosphorIconLayer(selectedLayer.id, {
                        rotation: Number(e.target.value),
                      })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              )}

              {/* Option: Opacity */}
              {activeOption === 'opacity' && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Opacity</span>
                    <span className="font-mono text-slate-400">
                      {selectedLayer.opacity ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={selectedLayer.opacity ?? 100}
                    onChange={(e) =>
                      state.updatePhosphorIconLayer(selectedLayer.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
