namespace GenericPaladinsPack {
    
    const KNOWLEDGE_PLEDGE_TRAIT = "wh_dlc07_trait_brt_knights_vow_knowledge_pledge_agent"
    const CHIVALRY_PLEDGE_TRAIT = "wh_dlc07_trait_brt_knights_vow_chivalry_pledge_agent"
    const ORDER_PLEDGE_TRAIT = "wh_dlc07_trait_brt_knights_vow_order_pledge_agent"
    const KNIGHT_VOW_TRAITS = [
        KNOWLEDGE_PLEDGE_TRAIT, 
        CHIVALRY_PLEDGE_TRAIT, 
        ORDER_PLEDGE_TRAIT
    ]

    const HEROISM_PLEDGE_TRAIT = "wh_dlc07_trait_brt_questing_vow_heroism_pledge_agent"
    const CAMPAIGN_PLEDGE_TRAIT = "wh_dlc07_trait_brt_questing_vow_campaign_pledge_agent"
    const PROTECT_PELDGE_TRAIT = "wh_dlc07_trait_brt_questing_vow_protect_pledge_agent"
    const QUESTING_VOW_TRAITS = [
        HEROISM_PLEDGE_TRAIT,
        CAMPAIGN_PLEDGE_TRAIT,
        PROTECT_PELDGE_TRAIT
    ]


    const VALOUR_PLEDGE_TRAIT = "wh_dlc07_trait_brt_grail_vow_valour_pledge_agent"
    const DESTROY_PLEDGE_TRAIT = "wh_dlc07_trait_brt_grail_vow_destroy_pledge_agent"
    const UNTAINT_PLEDGE_TRAIT = "wh_dlc07_trait_brt_grail_vow_untaint_pledge_agent"
    const GRAIL_VOW_TRAITS = [
        VALOUR_PLEDGE_TRAIT,
        DESTROY_PLEDGE_TRAIT,
        UNTAINT_PLEDGE_TRAIT
    ]

    const VOW_LEGENDARY_LORD_CULTURES: ConstString2String = {
        ["wh_main_chs_chaos"] : UNTAINT_PLEDGE_TRAIT,
        ["wh3_main_dae_daemons"] : UNTAINT_PLEDGE_TRAIT,
        ["wh3_main_kho_khorne"] : UNTAINT_PLEDGE_TRAIT,
        ["wh3_main_nur_nurgle"] : UNTAINT_PLEDGE_TRAIT,
        ["wh3_main_sla_slaanesh"] : UNTAINT_PLEDGE_TRAIT,
        ["wh3_main_tze_tzeentch"] : UNTAINT_PLEDGE_TRAIT,
        ["wh2_main_skv_skaven"] : UNTAINT_PLEDGE_TRAIT,
        ["wh_main_vmp_vampire_counts"] : UNTAINT_PLEDGE_TRAIT,
        ["wh2_dlc11_cst_vampire_coast"] : UNTAINT_PLEDGE_TRAIT,
        ["wh_dlc03_bst_beastmen"] : PROTECT_PELDGE_TRAIT,
        ["wh_main_grn_greenskins"] : PROTECT_PELDGE_TRAIT,
        ["wh2_main_def_dark_elves"] : PROTECT_PELDGE_TRAIT,
        ["wh3_main_ogr_ogre_kingdoms"] : PROTECT_PELDGE_TRAIT
    }


    const  VOW_MAX_POINTS: ConstString2Number = {
        [CAMPAIGN_PLEDGE_TRAIT] : 2, //should 
	    [HEROISM_PLEDGE_TRAIT] : 2,  //be
	    [PROTECT_PELDGE_TRAIT] : 2,  //1
    }

    const ADM_NELSON_GRAIL_PALADINS_DATA = "ADM_NELSON_GRAIL_PALADINS_DATA"

    type GrailPaladinId = number

    type GrailPaladinSaveData = {
        GrailPaladins: GrailPaladinId[]
    }

    const MAX_POINTS = 6

    const logger = new Logger("PaladinVowHandler")
    const print = (x: string) => logger.Log(x)

    export class PaladinVowHandler {

        static AllowedAgentKeys : LuaSet<string> = new LuaSet<string>()
        private static bInited = false

        private static GrailPaladinsData: GrailPaladinSaveData | null = null

        public static IsKnightsVowOK(character: Character): boolean {
            for (const trait of KNIGHT_VOW_TRAITS) {
                const maxTraitLevel = VOW_MAX_POINTS[trait] || 6
                if(character.GetTraitLevel(trait) == maxTraitLevel) return true
            }
            return false
        }
        
        public static IsQuestingVowOK(character: Character): boolean {
            for (const trait of QUESTING_VOW_TRAITS) {
                const maxTraitLevel = VOW_MAX_POINTS[trait] || 6
                if(character.GetTraitLevel(trait) == maxTraitLevel) return true
            }
            return false
        }

        public static IsGrailVowOK(character: Character): boolean {
            for (const trait of GRAIL_VOW_TRAITS) {
                const maxTraitLevel = VOW_MAX_POINTS[trait] || 6
                if(character.GetTraitLevel(trait) == maxTraitLevel ) return true
            }
            return false
        }

        private static IsVowHasPassed(character: Character, traitKey: string) {

            if(traitKey.startsWith("wh_dlc07_trait_brt_knights_vow")) {
                return PaladinVowHandler.IsKnightsVowOK(character) &&
                      !PaladinVowHandler.IsQuestingVowOK(character) &&
                      !PaladinVowHandler.IsGrailVowOK(character)
            } else if(traitKey.startsWith("wh_dlc07_trait_brt_questing_vow")) {                
                return PaladinVowHandler.IsKnightsVowOK(character) && 
                       PaladinVowHandler.IsQuestingVowOK(character) &&
                      !PaladinVowHandler.IsGrailVowOK(character)
            } else if (traitKey.startsWith("wh_dlc07_trait_brt_grail_vow")) {
                return PaladinVowHandler.IsKnightsVowOK(character) && 
                       PaladinVowHandler.IsQuestingVowOK(character) && 
                       PaladinVowHandler.IsGrailVowOK(character)
            }

            return false
        }

        private static CheckIfTraitEnoughToTriggerEvent(character: Character, traitKey: string) {
            print(`AddVowProgress - ${character.LocalisedFullName}  trait ${traitKey} `)
            print(`traits on this character: ${JSON.stringify(character.Traits)}`)
            if (!character.HasTrait(traitKey)) return

            const maxTraitLevel = VOW_MAX_POINTS[traitKey] || MAX_POINTS
            const traitLevel = character.GetTraitLevel(traitKey)

            print(`Max Points - " .. ${maxTraitLevel}`)

            const incidentKey = "wh_dlc07_incident_brt_vow_gained"
            
            const newTraitLevel = character.GetTraitLevel(traitKey)
            print(`new trait level is ${traitKey}`)
            //character.AddTrait(traitKey, false) -- no need to
            if(traitKey.startsWith("wh_dlc07_trait_brt_knights_vow") && PaladinVowHandler.IsVowHasPassed(character, traitKey)) {
                print(`Triggering event for this character ${character.LocalisedFullName}`)
                character.TriggerIncident(incidentKey)
                core.trigger_event("ScriptEventBretonniaKnightsVowCompleted", character.GetInternalInterface())
            }
            if(traitKey.startsWith("wh_dlc07_trait_brt_questing_vow")  && PaladinVowHandler.IsVowHasPassed(character, traitKey)) {
                print(`Triggering event for this character ${character.LocalisedFullName}`)
                character.TriggerIncident(incidentKey)
                core.trigger_event("ScriptEventBretonniaQuestingVowCompleted", character.GetInternalInterface())
            }
            if (traitKey.startsWith("wh_dlc07_trait_brt_grail_vow")  && PaladinVowHandler.IsVowHasPassed(character, traitKey)) {
                const characterCqiNr = character.CqiNo
                if( PaladinVowHandler.GrailPaladinsData && 
                    PaladinVowHandler.GrailPaladinsData.GrailPaladins && 
                   !PaladinVowHandler.GrailPaladinsData.GrailPaladins.includes(characterCqiNr))
                   {
                        print(`Triggering event for this character ${character.LocalisedFullName}`)
                        character.TriggerIncident(incidentKey)
                        core.trigger_event("ScriptEventBretonniaGrailVowCompleted", character.GetInternalInterface())
                        PaladinVowHandler.SerialisedGrailPaladins()
                   }
            }
        }

        private static AddTraitsToAllAgentsInArmy(whichForce: IMilitaryForceScript, traitKey: string) {
            if(whichForce.is_null_interface()) return
            const charaters = WrapICharacterObjectListToCharacterArray(whichForce.character_list())
            for (const character of charaters) {
                if(PaladinVowHandler.AllowedAgentKeys.has(character.SubtypeKey)) {
                    print(`traits on this character ${character.LocalisedFullName} traits: ${JSON.stringify(character.Traits)}`)
                    if(traitKey.startsWith("wh_dlc07_trait_brt_questing_vow") && PaladinVowHandler.IsKnightsVowOK(character)) {                
                        if(character.HasTrait(traitKey)) {
                            character.AddTrait(traitKey, false)
                            PaladinVowHandler.CheckIfTraitEnoughToTriggerEvent(character, traitKey)
                        }
                    } else if (traitKey.startsWith("wh_dlc07_trait_brt_grail_vow") && PaladinVowHandler.IsQuestingVowOK(character)) {
                        if(character.HasTrait(traitKey)) {
                            character.AddTrait(traitKey, false)
                            PaladinVowHandler.CheckIfTraitEnoughToTriggerEvent(character, traitKey)
                        }
                    }                    
                }
            }
        }

        //doesn't need to be in army
        private static AddPledgeToKnowledgeTrait(context: IContext) {            
            if(context.character == null) return
            if( (context.mission_result_critial_success != null && context.mission_result_critial_success()) ||
                (context.mission_result_success != null && context.mission_result_success())
            )
            {
                const character = WrapICharacterObjectToCharacter(context.character())  
                if(!PaladinVowHandler.AllowedAgentKeys.has(character.SubtypeKey)) return
                if(PaladinVowHandler.IsKnightsVowOK(character)) return

                const trait = KNOWLEDGE_PLEDGE_TRAIT                
                if(character.HasTrait(trait)) {
                    character.AddTrait(trait, false)
                    PaladinVowHandler.CheckIfTraitEnoughToTriggerEvent(character, trait)
                }

            }
        }

        //doesn't need to be in army
        private static AddPledgeToKnowledgeResearchTrait(context: IContext) {            
            if(context.faction == null) return
            const faction = WrapIFactionScriptToFaction(context.faction())
            if(!faction?.IsHuman) return
            if(faction.Culture != "wh_main_brt_bretonnia") return

            const champions = faction.Champions
            for (const champion of champions) {
                const trait = KNOWLEDGE_PLEDGE_TRAIT
                if(PaladinVowHandler.AllowedAgentKeys.has(champion.SubtypeKey) &&
                   !PaladinVowHandler.IsKnightsVowOK(champion) &&
                   champion.HasTrait(trait)) {
                    champion.AddTrait(trait, false)
                    PaladinVowHandler.CheckIfTraitEnoughToTriggerEvent(champion, trait)
                }
            }
        }

        //doesn't need to be in army
        private static AddPledgeToChivalryTrait(context: IContext) {            
            if(context.character == null) return
            if(context.ranks_gained == null) return

            const character = WrapICharacterObjectToCharacter(context.character())      
            if(!PaladinVowHandler.AllowedAgentKeys.has(character.SubtypeKey)) return
            if(PaladinVowHandler.IsKnightsVowOK(character)) return


            const ranksGained = context.ranks_gained()
            const trait = CHIVALRY_PLEDGE_TRAIT

            if(character.HasTrait(trait)) {
                for (let i = 0; i < ranksGained; i++) {
                    character.AddTrait(trait, false)                    
                }
                PaladinVowHandler.CheckIfTraitEnoughToTriggerEvent(character, trait)
            }
            
        }

        //doesn't need to be in army
        private static AddPledgeToOrder(context: IContext) {            
            if(context.building == null) return

            const building = context.building()
            const buildingRegionKey = building.region().name()
            const charactersInThatRegion = WrapICharacterObjectListToCharacterArray(building.faction().character_list())
            const trait = ORDER_PLEDGE_TRAIT

            for (const char of charactersInThatRegion) {
                if((PaladinVowHandler.AllowedAgentKeys.has(char.SubtypeKey)) && 
                    char.IsInRegion && 
                    char.CurrentRegionKey == buildingRegionKey &&
                    !PaladinVowHandler.IsKnightsVowOK(char) &&
                    char.HasTrait(trait)) {
                    char.AddTrait(trait)
                    PaladinVowHandler.CheckIfTraitEnoughToTriggerEvent(char, trait)
                }
            }
        }

        //MUST be in army
        private static AddPledgeToDestroy(context: IContext) {
            print(`i was called ${debug.traceback()}`)

            if(context.character == null) return
            if(context.garrison_residence == null) return

            const character = WrapICharacterObjectToCharacter(context.character())
            const garrisonResidence = context.garrison_residence()

            const faction = character.Faction

            if(!faction.IsHuman) return
            if(faction.Culture != "wh_main_brt_bretonnia") return
            if(!garrisonResidence.region().is_province_capital()) return
            if(!character.IsInMilitaryForce) return
            const trait = DESTROY_PLEDGE_TRAIT
            PaladinVowHandler.AddTraitsToAllAgentsInArmy(character.GetInternalInterface().military_force(), trait)
        }

        //MUST be in army
        private static AddPledgeToCampaign(context: IContext) {
            if(context.pending_battle == null) return
            if(context.character == null) return
            const pendingBattle = context.pending_battle()
            if(pendingBattle.battle_type() != "settlement_standard") return

            const character = WrapICharacterObjectToCharacter(context.character())
            if(!character.IsRecentlyWonBattle) return

            const faction = character.Faction
            if(!faction.IsHuman) return
            if(faction.Culture != "wh_main_brt_bretonnia") return
            if(!pendingBattle.has_attacker()) return
            if(!character.HasSameInternalReferenceTo(pendingBattle.attacker())) return
            if(!character.IsInRegion) return

            const climate = character.GetInternalInterface().region().settlement().get_climate()
            if(climate == "climate_desert" || climate == "climate_jungle") {
                const trait = CAMPAIGN_PLEDGE_TRAIT
                PaladinVowHandler.AddTraitsToAllAgentsInArmy(character.GetInternalInterface().military_force(), trait)
            }


        }

        //MUST be in army
        private static AddPledgeToManaan(context: IContext) {
            if(context.character == null) return
            const character = WrapICharacterObjectToCharacter(context.character())
            if(!character.IsAtSea) return
            if(!character.Faction.IsHuman) return
            if(character.Faction.Culture != "wh_main_brt_bretonnia") return
            
            const trait = HEROISM_PLEDGE_TRAIT
            if(!character.IsInMilitaryForce) return
            PaladinVowHandler.AddTraitsToAllAgentsInArmy(character.GetInternalInterface().military_force(), trait)

        }

        //Pledge to Valour
        //Pledge to Protect
        //Pledge to Untaint
        //MUST be in army
        private static AddKillLordsOrLegendaryLordPledgeDefender(context: IContext) {
            if(!cm.pending_battle_cache_defender_victory()) return

            const LoopBodyI = (i: number) => {
                const familyMember = cm.get_family_member_by_cqi(cm.pending_battle_cache_get_defender_fm_cqi(i))
                if(familyMember == null) return
                if(familyMember.is_null_interface()) return
                if(familyMember.character().is_null_interface()) return
                
                const defenderCharacter = WrapICharacterObjectToCharacter(familyMember.character())

                if(!defenderCharacter.IsValid()) return
                if(defenderCharacter.Faction.Culture != "wh_main_brt_bretonnia") return

                const trait = VALOUR_PLEDGE_TRAIT                
                const militaryForce = defenderCharacter.GetInternalInterface().military_force()
                if(militaryForce.is_null_interface()) return
                PaladinVowHandler.AddTraitsToAllAgentsInArmy(militaryForce, trait)
            }

            const LoopBodyJ = (i: number, j: number) => {
                const enemyLordCharacterDetails = cm.get_family_member_by_cqi(cm.pending_battle_cache_get_attacker_fm_cqi(j)).character_details()
                if(enemyLordCharacterDetails.is_null_interface()) return
                if(!enemyLordCharacterDetails.is_unique()) return

                const defeatedCharacterVow = VOW_LEGENDARY_LORD_CULTURES[enemyLordCharacterDetails.faction().culture()]
                if(defeatedCharacterVow == null) return

                const familyMemberCqi = cm.get_family_member_by_cqi(cm.pending_battle_cache_get_attacker_fm_cqi(i))
                if(familyMemberCqi.is_null_interface()) return
                if(familyMemberCqi.character().is_null_interface()) return
                const attackerCharacther = WrapICharacterObjectToCharacter(familyMemberCqi.character())
                
                const militaryForce = attackerCharacther.GetInternalInterface().military_force()
                if(militaryForce.is_null_interface()) return
                PaladinVowHandler.AddTraitsToAllAgentsInArmy(militaryForce, defeatedCharacterVow)
            }

            const numDefenders = cm.pending_battle_cache_num_defenders()
            for (let i = 1; i <= numDefenders; i++) {
                LoopBodyI(i)
                const numberOfDefenders = cm.pending_battle_cache_num_attackers()
                for (let j = 1; j <= numberOfDefenders; j++) {
                    LoopBodyJ(i, j)                    
                }
            }
        }

        //Pledge to Valour
        //Pledge to Protect
        //Pledge to Untaint
        //MUST be in army
        private static AddKillLordsOrLegendaryLordPledgeAttacker(context: IContext) {
            if(!cm.pending_battle_cache_attacker_victory()) return

            const LoopBodyI = (i: number) => {
                const familyMember = cm.get_family_member_by_cqi(cm.pending_battle_cache_get_attacker_fm_cqi(i))
                if(familyMember == null) return
                if(familyMember.is_null_interface()) return
                if(familyMember.character().is_null_interface()) return
                const attackerCharacther = WrapICharacterObjectToCharacter(familyMember.character())

                // Check the family member has a character interface, as a non-legendary reinforcing character can both win and die
                if(!attackerCharacther.IsValid()) return
                if(attackerCharacther.Faction.Culture != "wh_main_brt_bretonnia") return

                const trait = VALOUR_PLEDGE_TRAIT
                const militaryForce = attackerCharacther.GetInternalInterface().military_force()
                if(militaryForce.is_null_interface()) return
                PaladinVowHandler.AddTraitsToAllAgentsInArmy(militaryForce, trait)
            }

            const LoopBodyJ = (i: number, j: number) => {
                const enemyLordCharacterDetails = cm.get_family_member_by_cqi(cm.pending_battle_cache_get_defender_fm_cqi(j)).character_details()
                if(enemyLordCharacterDetails == null) return
                if(enemyLordCharacterDetails.is_null_interface()) return
                if(!enemyLordCharacterDetails.is_unique()) return

                const defeatedCharacterVow = VOW_LEGENDARY_LORD_CULTURES[enemyLordCharacterDetails.faction().culture()]
                if(defeatedCharacterVow == null) return

                const familyMemberCqi = cm.get_family_member_by_cqi(cm.pending_battle_cache_get_attacker_fm_cqi(i))
                if(familyMemberCqi.is_null_interface()) return
                if(familyMemberCqi.character().is_null_interface()) return
                const attackerCharacther = WrapICharacterObjectToCharacter(familyMemberCqi.character())

                const trait = VALOUR_PLEDGE_TRAIT
                const militaryForce = attackerCharacther.GetInternalInterface().military_force()
                if(militaryForce.is_null_interface()) return
                PaladinVowHandler.AddTraitsToAllAgentsInArmy(militaryForce, trait)
            }

            const numberOfAttackers = cm.pending_battle_cache_num_attackers()
            for (let i = 1; i <= numberOfAttackers; i++) {
                LoopBodyI(i)
                //check for vow to kill legendary lords
                //defender in this case is our enemey from bretonnia POV
                const numberOfDefenders = cm.pending_battle_cache_num_defenders()
                for (let j = 1; j <= numberOfDefenders; j++) {
                    LoopBodyJ(i, j)                    
                }
            }

            return
        }

        static UnlockAllVows(character: Character) {
            if(!this.IsKnightsVowOK(character)) {
                const trait = CHIVALRY_PLEDGE_TRAIT
                for (let i = 0; i < 7; i++) {
                    character.AddTrait(trait, false)                    
                }
            }

            if(!this.IsQuestingVowOK(character)) {
                const trait = CAMPAIGN_PLEDGE_TRAIT
                for (let i = 0; i < 3; i++) {
                    character.AddTrait(trait, false)                    
                }
            }

            if(!this.IsGrailVowOK(character)) {
                const trait = VALOUR_PLEDGE_TRAIT
                for (let i = 0; i < 7; i++) {
                    character.AddTrait(trait, false)                    
                }
            }

            print(`unlocking trait for this character ${character.SubtypeKey} ${character.LocalisedFullName}`)
            print(JSON.stringify(character.Traits))
        }

        static ResetVow(character: Character, vow?: "knightvow"|"questingvow"|"grailvow"|"complete") {
            if(!PaladinVowHandler.AllowedAgentKeys.has(character.SubtypeKey)) return

            for (const trait of KNIGHT_VOW_TRAITS) {
                character.RemoveTrait(trait)
            }
            for (const trait of QUESTING_VOW_TRAITS) {
                character.RemoveTrait(trait)
            }
            for (const trait of GRAIL_VOW_TRAITS) {
                character.RemoveTrait(trait)
            }

            if(vow == null) {
                logger.LogWarn(`vow was reset for this character ${character.LocalisedFullName}\n list of traits ${JSON.stringify(character.Traits)}`)
                return
            }

            switch (vow) {
                case "complete":
                    character.AddTrait(VALOUR_PLEDGE_TRAIT, false, 6)
                case "grailvow":                    
                    character.AddTrait(CAMPAIGN_PLEDGE_TRAIT, false, 2)
                case "questingvow":
                    character.AddTrait(KNOWLEDGE_PLEDGE_TRAIT, false, 6)
                case "knightvow":
                default:
                    break;
            }

            logger.LogWarn(`vow was reset to ${vow} for this character ${character.LocalisedFullName}\n list of traits ${JSON.stringify(character.Traits)}`)
        }

        private static GrailPaladinsLevelUpForBot(charater: Character): void {
            const agentSubtypeKey = charater.SubtypeKey
            if(charater.Faction.IsHuman) return
            if(!PaladinVowHandler.AllowedAgentKeys.has(agentSubtypeKey)) return
            if(this.IsGrailVowOK(charater)) return

            const rank = charater.Rank
            logger.Log(`this paladin ${charater.LocalisedFullName}'s vow (current level ${rank}) will be upgraded to:`)
            if(IsBetween(rank, 2, 5)) {
                this.ResetVow(charater, "knightvow")
                logger.Log(`knightvow`)
            } else if (IsBetween(rank, 6, 8)) {
                this.ResetVow(charater, "questingvow")
                logger.Log(`questingvow`)
            } else if (rank >= 9) {
                this.ResetVow(charater, "complete")
                logger.Log(`complete`)
                PaladinVowHandler.SerialisedGrailPaladins()
            }
        }

        private static UpdateAllGrailPaladinsForBot(): void {
            logger.Log(`updating grail paladins state for bots`)
            for (const factionKey of BretonnianFactionsKeys) {
                const faction = GetFactionByKey(factionKey) 
                if(faction && !faction.IsHuman) {
                    const paladinsInFaction = faction.Characters.filter ( champion => PaladinHeroAgentKeys.includes(champion.SubtypeKey) )
                    if(paladinsInFaction) {
                        for (const character of paladinsInFaction) {
                            PaladinVowHandler.GrailPaladinsLevelUpForBot(character)
                        }
                    }
                }
            }
            logger.Log(`updating grail paladins state for bots: done`)
        }

        private static SerialisedGrailPaladins(): void {
            let paladins: Character[] = []
            for (const factionKey of BretonnianFactionsKeys) {
                const faction = GetFactionByKey(factionKey) 
                if(faction) {
                    const paladinsInFaction = faction.Characters.filter ( champion => PaladinVowHandler.AllowedAgentKeys.has(champion.SubtypeKey) )
                    if(paladinsInFaction)
                        paladins = paladins.concat(paladinsInFaction)
                }
            }

            let paladinCqiNr = []
            for (const paladin of paladins) {
                paladinCqiNr.push(paladin.CqiNo)
            }

            const paladinData = {
                GrailPaladins: paladinCqiNr
            }

            PaladinVowHandler.GrailPaladinsData = paladinData

            const data =  JSON.stringify(PaladinVowHandler.GrailPaladinsData)
            localStorage.setItem(ADM_NELSON_GRAIL_PALADINS_DATA, data)
            logger.LogWarn(`saving grail paladin data: ${data}`)
        }

        private static DeserialisedGrailPaladins(): void {
            if(localStorage.getItem(ADM_NELSON_GRAIL_PALADINS_DATA) == null) {
                PaladinVowHandler.SerialisedGrailPaladins()
                return
            }

            const data = localStorage.getItem(ADM_NELSON_GRAIL_PALADINS_DATA) as string
            if(data) {
                logger.Log(`loading grail paladin data: ${data}`)
                try {
                    const parsed = JSON.parse(data) as GrailPaladinSaveData
                    PaladinVowHandler.GrailPaladinsData = parsed
                } catch (e) {
                    logger.LogError(`unable to parse: reason ${e} `)
                }
            }

        }

        static Init() {
            if(PaladinVowHandler.bInited) return
            
            if(localStorage.getItem(ADM_NELSON_GRAIL_PALADINS_DATA) == null) {
                logger.LogWarn(`${ADM_NELSON_GRAIL_PALADINS_DATA} tag was not found. updating all grail paladins for bot...`)
                PaladinVowHandler.UpdateAllGrailPaladinsForBot()
            }
            PaladinVowHandler.DeserialisedGrailPaladins()

            print("ready")
            PaladinVowHandler.bInited = true
            //knights vow
            core.add_listener(
                "generic paladin admiralnelson_research_completed_pledge_to_knowledge",
                "ResearchCompleted",
                true,
                (context: IContext) => PaladinVowHandler.AddPledgeToKnowledgeResearchTrait(context), 
                true
            )
            
            core.add_listener(
                "generic paladin admiralnelson_character_character_target_action_pledge_to_knowledge",
                "CharacterCharacterTargetAction",
                true,
                (context: IContext) => PaladinVowHandler.AddPledgeToKnowledgeTrait(context), 
                true
            )

            core.add_listener(
                "generic paladin admiralnelson_building_completed_pledge_to_order",
                "BuildingCompleted",
                true,
                (context: IContext) => PaladinVowHandler.AddPledgeToOrder(context), 
                true
            )

            core.add_listener(
                "generic paladin admiralnelson_character_rank_up_pledge_to_chivalry",
                "CharacterRankUp",
                true,
                (context: IContext) => PaladinVowHandler.AddPledgeToChivalryTrait(context), 
                true
            )

            core.add_listener(
                "generic paladin upgrade rank for bot",
                "CharacterRankUp",
                true,
                (context: IContext) => {
                    if(context.character == null) return
                    const character = WrapICharacterObjectToCharacter(context.character()) 
                    PaladinVowHandler.GrailPaladinsLevelUpForBot(character)
                }, 
                true
            )

            //questing vows
            core.add_listener(
                "generic paladin admiralnelson_character_completed_battle_pledge_to_campaign",
                "CharacterCompletedBattle",
                true,
                (context: IContext) => PaladinVowHandler.AddPledgeToCampaign(context), 
                true
            )

            core.add_listener(
                "generic paladin admiralnelson_character_completed_battle_pledge_to_heroism",
                "CharacterCompletedBattle",
                true,
                (context: IContext) => PaladinVowHandler.AddPledgeToManaan(context), 
                true
            )

            //grail vows
            core.add_listener(
                "generic paladin admiralnelson_character_completed_battle_grail_vow",
                "BattleCompleted",
                true,
                (context: IContext) => {
                    PaladinVowHandler.AddKillLordsOrLegendaryLordPledgeAttacker(context)
                    PaladinVowHandler.AddKillLordsOrLegendaryLordPledgeDefender(context)
                }, 
                true
            )

            core.add_listener(
                "generic paladin admiralnelson_character_razed_setlement_pledge_to_destroy",
                "CharacterRazedSettlement",
                true,
                (context: IContext) => PaladinVowHandler.AddPledgeToDestroy(context), 
                true
            )

        }

       
    }

}