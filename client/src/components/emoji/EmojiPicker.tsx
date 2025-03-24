import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { 
  Search, History, Smile, Star, Coffee, Gamepad, Music, 
  Heart, Car, Cloud, Flower2, Camera, Flag, UserCircle2, 
  Trophy, Hash
} from "lucide-react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  maxLength: number;
  currentLength: number;
}

// Categorías de emojis con sus emojis correspondientes
const EMOJI_CATEGORIES = {
  recent: { icon: History, label: "Recientes", emojis: [] },
  smileys: {
    icon: Smile,
    label: "Caras y Personas",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", 
             "😗", "😙", "😚", "🤪", "😝", "😜", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😔", "😟",
             "😕", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱",
             "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩"]
  },
  people: {
    icon: UserCircle2,
    label: "Profesiones",
    emojis: ["👨‍💻", "👩‍💻", "👨‍🏫", "👩‍🏫", "👨‍⚕️", "👩‍⚕️", "👨‍🌾", "👩‍🌾", "👨‍🍳", "👩‍🍳", "👨‍🔧", "👩‍🔧",
             "👨‍🎨", "👩‍🎨", "👨‍🚀", "👩‍🚀", "👨‍🚒", "👩‍🚒", "👮‍♂️", "👮‍♀️", "🕵️‍♂️", "🕵️‍♀️", "💂‍♂️", "💂‍♀️",
             "👷‍♂️", "👷‍♀️", "👨‍🌾", "👩‍🌾", "👨‍🍳", "👩‍🍳", "👨‍🎤", "👩‍🎤", "👨‍🎨", "👩‍🎨", "👨‍✈️", "👩‍✈️",
             "👨‍🚀", "👩‍🚀", "👨‍⚖️", "👩‍⚖️", "👨‍💼", "👩‍💼", "👨‍🔬", "👩‍🔬", "👨‍🔧", "👩‍🔧", "👨‍🏭", "👩‍🏭"]
  },
  nature: {
    icon: Flower2,
    label: "Naturaleza",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔",
             "🌸", "🌺", "🌹", "🌷", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑",
             "🦒", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐪", "🐫", "🦙", "🦘", "🦥", "🦦", "🦫", "🦃",
             "🐉", "🐲", "🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "☘️", "🍀", "🎍", "🎋", "🍃", "🍂", "🍁"]
  },
  gaming: {
    icon: Gamepad,
    label: "Gaming",
    emojis: ["🎮", "🕹️", "👾", "🎲", "♟️", "🎯", "🎪", "🎨", "🎭", "🎪", "🎢", "🎡", "🎠", "🎪", "🎭", "🎨",
             "🃏", "🀄", "🎴", "🎱", "🎳", "🎮", "🕹️", "🎰", "🎲", "🎯", "🎳", "🎪", "🎭", "🎨", "🖼️", "🎰",
             "🎳", "🎯", "🎱", "🔮", "🎮", "🕹️", "🎲", "♟️", "🃏", "🀄️", "🎴", "🎭", "🖼️", "🎨", "🎪", "🎢",
             "🏹", "⚔️", "🛡️", "🗡️", "🔫", "🏹", "🎣", "🥊", "🎽", "🎿", "🛷", "⛸️", "🥌", "🎯", "♟️", "🎲"]
  },
  food: {
    icon: Coffee,
    label: "Comida",
    emojis: ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🧇", "🥞", "🧈", "🍞", "🥐", "🥨", "🥯",
             "🥗", "🥙", "🥪", "🌮", "🌯", "🫔", "🥫", "🍖", "🍗", "🥩", "🍠", "🥟", "🥠", "🥡", "🍱", "🍘",
             "🍲", "🫕", "🥘", "🍝", "🍜", "🍛", "🍚", "🍙", "🍤", "🍣", "🥮", "🍡", "🍧", "🍨", "🍦", "🥧",
             "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "☕"]
  },
  activities: {
    icon: Trophy,
    label: "Deportes",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
             "🏹", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🎿", "⛷️", "🏂", "🪂", "🏋️‍♀️", "🤼", "🤸‍♀️", "🤺",
             "⛳", "🏊‍♂️", "🏊‍♀️", "🏄‍♂️", "🏄‍♀️", "🏇", "🏌️‍♂️", "🏌️‍♀️", "🏋️‍♂️", "🏋️‍♀️", "⛹️‍♂️", "⛹️‍♀️", "🤺", "🤾‍♂️", "🤸‍♂️", "🤼‍♂️",
             "🎳", "🏏", "🏑", "🏒", "🥌", "⛸️", "🛷", "🎿", "⛷️", "🏂", "🪂", "🏋️‍♂️", "🤼‍♂️", "🤸‍♂️", "🤺", "⛳"]
  },
  music: {
    icon: Music,
    label: "Música",
    emojis: ["🎵", "🎶", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎤", "🎧", "🎙️", "🎚️", "🎛️", "📻",
             "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🪗", "🎸", "🪕", "🎻", "🎤", "🎧", "📻", "🎙️", "🎚️", "🎛️",
             "🔈", "🔉", "🔊", "📢", "📣", "📯", "🔔", "🔕", "🎼", "🎵", "🎶", "〽️", "🎗️", "🎺", "🪗", "🎸",
             "🎻", "🥁", "🪘", "🎹", "🎷", "📻", "🎙️", "🎚️", "🎛️", "🎤", "🎧", "🎼", "🎵", "🎶", "🔔", "📯"]
  },
  love: {
    icon: Heart,
    label: "Amor",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💗", "💓", "💕", "💖", "💝", "💘", "💌",
             "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "💔", "❤️‍🔥", "❤️‍🩹", "💋", "💫", "💭", "💦", "💨",
             "💑", "👩‍❤️‍👩", "👨‍❤️‍👨", "💏", "👩‍❤️‍💋‍👩", "👨‍❤️‍💋‍👨", "👫", "👭", "👬", "💖", "💝", "💘", "💟", "💌", "💕", "💞",
             "💓", "💗", "💖", "💕", "💝", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔", "❣️"]
  },
  weather: {
    icon: Cloud,
    label: "Clima",
    emojis: ["☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "💨", "🌪️", "🌫️", "🌊", "💧",
             "⚡", "❄️", "☃️", "⛄", "☔", "☂️", "🌈", "☀️", "🌤️", "🌥️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "⭐",
             "🌞", "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎", "🌍",
             "🌏", "💫", "⚡", "☄️", "💥", "🌪️", "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️"]
  },
  travel: {
    icon: Car,
    label: "Viajes",
    emojis: ["🚗", "✈️", "🚅", "🚢", "🚁", "🚀", "🛸", "🏖️", "🗺️", "🗽", "🗼", "🎢", "🎡", "🎠", "🏰", "⛰️",
             "🌋", "🗻", "🏕️", "⛺", "🏠", "🏡", "🏘️", "🏚️", "🏗️", "🏭", "🏢", "🏬", "🏣", "🏤", "🏥", "🏦",
             "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🏍️",
             "🚲", "🦼", "🛺", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅"]
  },
  objects: {
    icon: Camera,
    label: "Objetos",
    emojis: ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "📷", "🎥", "🎞️", "📽️", "📺", "📹", "📼", "🔍", "🔎",
             "💡", "🔦", "🏮", "📔", "📕", "📖", "📗", "📘", "📙", "📚", "📓", "📒", "📃", "📜", "📄", "📰",
             "🎥", "📹", "📽️", "📸", "📷", "📼", "🔍", "🔎", "💡", "🔦", "🏮", "📔", "📕", "📖", "📗", "📘",
             "⚒️", "🛠️", "⛏️", "🔨", "🪓", "🔧", "🔩", "⚙️", "🗜️", "⚖️", "🔗", "⛓️", "🪝", "🧰", "🧲", "🔮"]
  },
  symbols: {
    icon: Hash,
    label: "Símbolos",
    emojis: ["💯", "✨", "💫", "💥", "💢", "💦", "💨", "🕉️", "☮️", "✝️", "☪️", "🕎", "☯️", "☦️", "🛐", "⚛️",
             "📛", "🔰", "⭕", "✅", "☑️", "✔️", "❌", "❎", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✳️",
             "💱", "💲", "✴️", "❇️", "‼️", "⁉️", "❓", "❔", "❕", "❗", "〽️", "⚠️", "🚸", "🔰", "♻️", "✳️",
             "🆗", "🆙", "🆒", "🆕", "🆓", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
  },
  technology: {
    icon: Camera,
    label: "Tecnología",
    emojis: ["💻", "🖥️", "📱", "タブレット", "💾", "💿", "💻", "🖥️", "🖨️", "🖱️", "⌨️", "🕹️", "💾", "💿", "🧮", "💡", "🤖", "⚙️", "📡", "🛰️", "🚀", "🛸", "📡", "🛰️", "💡", "🔌", "🔋", "💡", "🔌", "🔋", "🔆"]
  },
  socialMedia: {
    icon: Hash,
    label: "Redes Sociales",
    emojis: ["📸", "🤳", "🎥", "📹", "📺", "📱", "💻", "🌐", "🌍", "🌎", "🌏", "📢", "📣", "💬", "🗣️", "👤", "👥", "❤️", "👍", "👎", "🔥", "💯", "🎉", "🎈", "🎊", "🎁", "🎀", "🎗️", "🎟️", "🎫", "🎭", "🎬"]
  }
};

export function EmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  maxLength,
  currentLength,
}: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState("smileys");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewEmoji, setPreviewEmoji] = useState<string | null>(null);
  const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>("recent-emojis", []);

  // Función para agregar un emoji a recientes
  const addToRecent = (emoji: string) => {
    setRecentEmojis((prev) => {
      const newRecent = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 32);
      return newRecent;
    });
  };

  // Función para manejar la selección de emoji
  const handleSelect = (emoji: string) => {
    if (currentLength + emoji.length <= maxLength) {
      onEmojiSelect(emoji);
      addToRecent(emoji);
      onClose();
    }
  };

  // Filtrar emojis basado en la búsqueda
  const getFilteredEmojis = () => {
    if (!searchTerm) return [];

    return Object.entries(EMOJI_CATEGORIES)
      .filter(([key]) => key !== 'recent')
      .flatMap(([_, category]) => category.emojis || [])
      .filter(emoji => emoji.indexOf(searchTerm) !== -1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-center">Selecciona un Emoji</h2>
            <p className="text-sm text-muted-foreground text-center">
              Caracteres disponibles: {maxLength - currentLength}
            </p>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar emoji..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {searchTerm ? (
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="grid grid-cols-8 gap-2">
                {getFilteredEmojis().map((emoji, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-9 w-9 p-0 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSelect(emoji)}
                    onMouseEnter={() => setPreviewEmoji(emoji)}
                    onMouseLeave={() => setPreviewEmoji(null)}
                    disabled={currentLength + emoji.length > maxLength}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 mb-4">
                {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => {
                  const Icon = category.icon;
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="px-2 py-1"
                      title={category.label}
                    >
                      <Icon className="h-4 w-4" />
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                <TabsContent key={key} value={key} className="mt-2">
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="grid grid-cols-8 gap-2 p-4">
                      {(key === "recent" ? recentEmojis : category.emojis)?.map(
                        (emoji, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="h-9 w-9 p-0 hover:bg-accent hover:text-accent-foreground relative group"
                            onClick={() => handleSelect(emoji)}
                            onMouseEnter={() => setPreviewEmoji(emoji)}
                            onMouseLeave={() => setPreviewEmoji(null)}
                            disabled={currentLength + emoji.length > maxLength}
                          >
                            {emoji}
                          </Button>
                        )
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Vista previa del emoji */}
          {previewEmoji && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-popover rounded-lg shadow-lg p-4 border">
              <div className="text-4xl text-center">{previewEmoji}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}