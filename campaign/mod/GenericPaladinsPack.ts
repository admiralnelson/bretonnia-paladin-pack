namespace GenericPaladinsPack {

    export const VERSION = 1

    const TAG_BRETPALADINPACK = "ADMBRETPALADINPACK"
    const TAG_VERSIONSTRING   = "ADMBRETPALADINPACK" + VERSION

    type BretPaladinPool = {
        factionKey: string
        paladinData: {
            agentKey: string
            count: number
        }[]
    }

    const logger = new Logger(`GenericPaladinsPack`)

    const log = (s: string) => logger.Log(s)
    const warn = (s: string) => logger.LogWarn(s)
    const err = (s: string) => logger.LogError(s)


    export class YourEntryPoint {

        private PaladinPoolData: BretPaladinPool[] = []

        private CountBigPaladins(faction: Faction): number {
            const paladins = faction.Characters.filter( paladin => MassifPaladins.includes(paladin.SubtypeKey) )
            return paladins.length
        }        

        private CountPaladinsInPool(faction: Faction, paladinKey: string): number {
            const pool = this.PaladinPoolData.find( pooldata => pooldata.factionKey == faction.FactionKey )
            if(pool == null) {
                warn(`This faction ${faction.FactionKey} doesn't have pool yet`)
                return 0
            }

            const map = new Map<string, number>()
            for (const data of pool.paladinData) {
                if(data.agentKey == paladinKey) {
                    if(!map.has(data.agentKey)) map.set(data.agentKey, 0)
                    else {
                        const count = map.get(data.agentKey) ?? 0
                        map.set(data.agentKey, count + 1)
                    }
                }
            }

            const keys = Array.from(map.keys())
            let count = 0
            for (const key of keys) {
                const num = map.get(key) ?? 0
                count += num
            }

            return count
        }

        private IncrementAgentCount(faction: Faction, agentKey: string) {
            const poolIdx = this.PaladinPoolData.findIndex( pooldata => pooldata.factionKey == faction.FactionKey )
            
            if(poolIdx == -1) {
                this.PaladinPoolData.push({
                    factionKey: faction.FactionKey,
                    paladinData: [{
                        agentKey: agentKey,
                        count: 1
                    }]
                })
                this.Save() 
                return
            }
            
            const paladinIdx = this.PaladinPoolData[poolIdx].paladinData.findIndex( paladinData => paladinData.agentKey == agentKey )
            if(paladinIdx == -1) {
                this.PaladinPoolData[poolIdx].paladinData.push( {
                    agentKey: agentKey,
                    count: 1
                })
            }
            else {
                this.PaladinPoolData[poolIdx].paladinData[paladinIdx].count++
            }
            this.Save()

        }

        private DecrementAgentCount(faction: Faction, agentKey: string) {
            const poolIdx = this.PaladinPoolData.findIndex( pooldata => pooldata.factionKey == faction.FactionKey )
            const paladinIdx = this.PaladinPoolData[poolIdx].paladinData.findIndex( paladinData => paladinData.agentKey == agentKey )
            
            if(poolIdx == -1) {
                err(`this faction ${faction.FactionKey} seems doesn't have pool associated but yet it can spawn one `)
                return
            }

            if(paladinIdx == -1) {
                err(`this faction ${faction.FactionKey} seems doesn't have pool associated with this agentkey ${agentKey} but yet it can spawn one `)
                return
            }
            
            this.PaladinPoolData[poolIdx].paladinData[paladinIdx].count--
            this.Save()
            
        }

        private Load(): void {
            if(localStorage.getItem(TAG_BRETPALADINPACK) == null) {
                this.Save()                
                return
            }

            const data = localStorage.getItem(TAG_BRETPALADINPACK) as string ?? ""
            try {
                const parsed = JSON.parse(data)
                this.PaladinPoolData = parsed
                warn(`loaded ${data}`)

            } catch (error) {
                err(`unable to parse json data ${error}`)
                alert(`Paladin Spawner\n unable to parse json data ${error}`)
            }

        }

        private Save(): void {
            if(localStorage.getItem(TAG_BRETPALADINPACK) == null) {
                localStorage.setItem(TAG_BRETPALADINPACK, JSON.stringify(this.PaladinPoolData))
                localStorage.setItem(TAG_VERSIONSTRING, true)
                warn(`starting fresh save`)
                return
            }

            const data = JSON.stringify(this.PaladinPoolData)
            localStorage.setItem(TAG_BRETPALADINPACK, data)
            warn(`Saving ${data}`)
        }

        private ResetPool(): void {
            for (const pooldata of this.PaladinPoolData) {
                pooldata.paladinData = []
            }
            this.Save()
        }

        SpawnPaladinToPool(subtypeKey: string, faction: Faction): void {
            cm.spawn_character_to_pool(faction.FactionKey, "", "", "", "", 18, true, "champion", subtypeKey, false, "")
            warn(`I picked ${subtypeKey} paladin to be added into pool ${faction.FactionKey}`)

            this.IncrementAgentCount(faction, subtypeKey)
            this.Save()
        }

        private AttemptToSpawnPaladin(faction: Faction): boolean {
            warn(`attempt to spawn paladin to pool for this faction ${faction.LocalisedName}`)

            const spawnMassifPaladinCheck = PercentageRoll(faction.IsHuman ? HUMAN_MASSIF_PALADIN_CHANCES : BOT_MASSIF_PALADIN_CHANCES)
            warn(`spawnMassifPaladinCheck: faction.IsHuman ${faction.IsHuman} chance ${faction.IsHuman ? HUMAN_MASSIF_PALADIN_CHANCES : BOT_MASSIF_PALADIN_CHANCES} => result ${spawnMassifPaladinCheck}`)

            const countBigpaladins = this.CountBigPaladins(faction)
            const massifPaladinCountCheck = countBigpaladins <= MAXIMUM_BIG_PALADINS
            warn(`massifPaladinCountCheck: ${countBigpaladins} => result ${massifPaladinCountCheck}`)

            const massifPaladinType = ChooseRandom(MassifPaladins) as string
            warn(`massifPaladinType => result ${massifPaladinType}`)

            const countBigPaladinInpool =  this.CountPaladinsInPool(faction, massifPaladinType)
            const massifPaladinCountInPoolCheck = countBigPaladinInpool <= ( faction.IsHuman ? 2 : 5 )
            warn(`massifPaladinCountInPoolCheck: ${countBigPaladinInpool} => result ${massifPaladinCountInPoolCheck}`)

            if(spawnMassifPaladinCheck && massifPaladinCountCheck && massifPaladinCountInPoolCheck) {
                this.SpawnPaladinToPool(massifPaladinType, faction)
                return true
            }
            warn(`failed to spawn big paladin. spawning another paladin type!`)

            const spawn2hPaladinCheck = PercentageRoll(faction.IsHuman ? HUMAN_2HANDED_PALADIN_CHANCES : BOT_2HANDED_PALADIN_CHANCES)
            warn(`spawn2hPaladinCheck: faction.IsHuman ${faction.IsHuman} chance ${faction.IsHuman ? HUMAN_2HANDED_PALADIN_CHANCES : BOT_2HANDED_PALADIN_CHANCES} => result ${spawn2hPaladinCheck}`)

            const normalPaladinType = ChooseRandom(NormalPaladins) as string
            warn(`normalPaladinType => result ${normalPaladinType}`)

            const twoHandedPaladinCountInPoolCheck = this.CountPaladinsInPool(faction, normalPaladinType) <= ( faction.IsHuman ? 2 : 5 )
            warn(`twoHandedPaladinCountInPoolCheck: faction.IsHuman ${faction.IsHuman} chance ${faction.IsHuman ? HUMAN_2HANDED_PALADIN_CHANCES : BOT_2HANDED_PALADIN_CHANCES} => result ${spawn2hPaladinCheck}`)

            if(spawn2hPaladinCheck && twoHandedPaladinCountInPoolCheck) {
                this.SpawnPaladinToPool(normalPaladinType, faction)
                return true
            }

            return false

        }

        private OnPaladinSpawnedFromPool(character: Character) {
            warn(`character recruited ${character.SubtypeKey}`)
            this.DecrementAgentCount(character.Faction, character.SubtypeKey)
        }

        OnTurnToResetPool(): void {
            warn(`current turn is ${cm.turn_number()} will reset in each multiplication of turns ${RESET_EACH_TURN}`)
            if(cm.turn_number() % RESET_EACH_TURN == 0) this.ResetPool()
        }

        private Init(): void {
            this.Load()
            this.SetupOnRecruitmentFromPool()
            this.SetupSpawner()
            this.SetupPaladinVows()
            this.SetupOnTurnToResetPool()
            this.SetupDebugConsole()
        }

        private SetupOnRecruitmentFromPool(): void {
            core.add_listener(
                "admiral nelson recruitment from paladin pool",
                "CharacterRecruited",
                (context) => {
                    const theChar = context.character ? context.character() : null
                    if(theChar == null) return false

                    const subtypeKey = theChar.character_subtype_key()
                    return PaladinHeroAgentKeys.indexOf(subtypeKey) >= 0
                },
                (context) => {
                    const theChar = context.character ? context.character() : null
                    if(theChar == null) return false
                    const char = WrapICharacterObjectToCharacter(theChar)
                    
                    this.OnPaladinSpawnedFromPool(char)
                },
                true
            )

            log("SetupOnRecruitmentFromPool ok")
        }

        private SetupSpawner(): void {
            core.add_listener( 
                `admiralnelson paladin spawner on turn start`,
                "FactionTurnStart",
                context => {
                    if(context.faction == null) return false
                    const faction = WrapIFactionScriptToFaction(context.faction()) 
                    if(faction == null) return false

                    return BretonnianFactionsKeys.includes(faction.FactionKey)
                },
                context => {
                    if(context.faction == null) return
                    const faction = WrapIFactionScriptToFaction(context.faction()) 
                    if(faction == null) return

                    this.AttemptToSpawnPaladin(faction)
                },
                true
             )

            log(`SetupSpawner ok`)
        }

        private SetupPaladinVows(): void {
            for (const paladin of PaladinHeroAgentKeys) {
                PaladinVowHandler.AllowedAgentKeys.add(paladin)
            }
            PaladinVowHandler.Init()
            
            log("SetupPaladinVows ok")
        }

        SetupOnTurnToResetPool(): void {
            core.add_listener(
                "admiral nelson reset pool every 10 turns",
                "EndOfRound",
                true,
                (_) => {
                    this.OnTurnToResetPool()
                },
                true
            )

            log("SetupOnTurnToResetPool ok")
        }


        private SetupDebugConsole(): void {
            ConsoleHandler.Register(`adm%-paladin%-add%-pool "(.*)"`, (param) => {
                if(param.length != 1) return

                const factionName = param[0].replaceAll(`"`, ``).trim()
                const faction = GetFactions().find( faction => faction.LocalisedName == factionName)
                if(faction == null) {
                    alert(`cannot find faction ${factionName}`)
                    return
                }

                const result = this.AttemptToSpawnPaladin(faction)
                if(!result) {
                    alert(`roll dice was failed. see console log!`)
                }
            })

            ConsoleHandler.Register(`adm%-paladin%-reset%-pool`, () => {
                this.ResetPool()
            })

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

                if(!PaladinVowHandler.AllowedAgentKeys.has(character.SubtypeKey)) {
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

            log("SetupDebugConsole ok")
        }

        constructor() {
            OnCampaignStart( () => this.Init() )
        }
    }
    
    new YourEntryPoint()
}