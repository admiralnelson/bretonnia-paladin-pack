namespace GenericPaladinsPack {

    export const VERSION = 1

    const log = new Logger("GenericPaladinsPack")
    const print = (s: string) => log.Log(s)

    export class YourEntryPoint {

        private Init(): void {
            this.SetupPaladinVows()
            this.SetupDebugConsole()
        }

        private SetupPaladinVows(): void {
            for (const paladin of PaladinHeroAgentKeys) {
                PaladinVowHandler.AllowedAgentKeys.add(paladin)
            }
            PaladinVowHandler.Init()
            
            print("SetupPaladinVows ok")
        }

        private SetupDebugConsole(): void {
            ConsoleHandler.Register(`adm%-paladin%-reset%-vow "(.*)" (.*)`, (param) => {
                if(param.length != 2) return

                const characterName = param[0].replaceAll(`"`, ``).trim()
                let character = null
                for (const factionKey of BretonnianFactionsKeys) {
                    character = GetFactionByKey(factionKey)?.Champions.find( paladin => paladin.LocalisedFullName == characterName )
                    if(character) break
                }

                if(character == null) {
                    alert(`unable to find "${characterName}" in the system`)
                    return
                }

                if(PaladinVowHandler.AllowedAgentKeys.has(character.SubtypeKey)) {
                    alert(`this paladin uses vow system that is not managed by PaladinVowHandler`)
                    return
                }

                const vowType = param[1]
                switch (vowType) {
                    case "knightvow":
                    case "questingvow":
                    case "grailvow":
                    case "complete":
                        break
                    default:
                        alert(`invalid 2nd parameter. expected: knightvow|questingvow|grailvow|complete`)
                        return
                }

                PaladinVowHandler.ResetVow(character, vowType)
                alert(`This champion ${character.LocalisedFullName} vow has been reset to ${vowType}.\n See console log for details`)
                
            })

            print("SetupDebugConsole ok")
        }

        constructor() {
            OnCampaignStart( () => this.Init() )
        }
    }
    
    new YourEntryPoint()
}