namespace GenericPaladinsPack {

    export const BretonnianFactionsKeys = [
         "wh_main_brt_bretonnia",
         "wh_main_brt_carcassonne", 
         "wh_main_brt_bordeleaux", 
         "wh2_dlc14_brt_chevaliers_de_lyonesse", 
         "wh2_main_brt_knights_of_origo", 
         "wh2_main_brt_knights_of_the_flame", 
         "wh2_main_brt_thegans_crusaders", 
         "wh3_dlc20_brt_march_of_couronne", 
         "wh3_main_brt_aquitaine", 
         "wh_main_brt_artois", 
         "wh_main_brt_bastonne", 
    ]

    export const RESET_EACH_TURN = 10
    export const DEBUG = true
    
    export const MAXIMUM_BIG_PALADINS = 6

    export const RESET_POOL_COUNT_THRESHOLD = 10

    export const BOT_MASSIF_PALADIN_CHANCES = 40
    export const HUMAN_MASSIF_PALADIN_CHANCES = 15

    export const BOT_2HANDED_PALADIN_CHANCES = 45
    export const HUMAN_2HANDED_PALADIN_CHANCES = 20

    export const NormalPaladins = [
        "admiralnelson_bret_paladin_2handed_agent_key"
    ]

    export const MassifPaladins = [
        "admiralnelson_bret_paladin_massif_agent_key",
        "admiralnelson_bret_paladin_massif_sword_shield_agent_key",
    ]

    export const PaladinHeroAgentKeys = NormalPaladins.concat(MassifPaladins)

}