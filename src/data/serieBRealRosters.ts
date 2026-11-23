import { ALL_TEAM_TEMPLATES } from './teams';
import {
  computeAgeFromBirthDate,
  getSeasonAgeReferenceDate,
  parseBirthDateToItalian,
} from '../engine/calendarUtils';
import { Nationality, Position } from '../types';
import type { CustomPlayerTemplate } from '../services/editorDbService';

const RAW_SERIE_B_PLAYERS_CSV = `teamId,teamName,leagueId,firstName,lastName,jerseyNumber,position,nationality,isItalianFormation,overall,birthDate
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Francesco,Boniciolli,1,PG/SG,ITA,True,67,2001-09-25
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Nicholas,Carr,4,PF/C,ITA,True,61,2004-11-10
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Janko,Cepic,6,PF/C,MNE,False,69,1999-06-09
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Emanuele,Trapani,9,PG,ITA,True,68,1999-01-11
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Albano,Chiarastella,12,SF,ITA/ARG,True,70,1985-10-21
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Stefano,Conte,13,PG/SG,ita,True,60,2005-10-22
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Matteo,Nicoli,21,PG,italia,True,66,2001-06-02
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Francesco,Iacono Quarantino,23,PG,Italia,True,53,2011-11-01
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Bryce,Douvier,31,C,AUT/USA,False,71,1991-12-01
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Alessio,Truglio,33,PG,ITA,True,60,2004-12-14
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Salvatore,Callea,61,PG,ITA,True,54,2009-04-16
moncada_energy_a,Moncada Energy Agrigento,serie_b_a,Saverio,Mazzantini,95,SG,ITA,True,68,1995-04-18
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Adriano,Bazan,0,SG,ITA,True,59,2006-03-21
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Luca,Vencato,3,PG,ITA,True,71,1995-05-31
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Lazar,Nikolic,5,SG,SRB,False,69,1999-06-23
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Mattia,Santinon,7,PG/SG,ITA,True,59,2006-04-07
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Santiago,Cabodevilla,9,SF,ARG,False,56,2007-06-19
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Francesco,Frosini,12,SF,ITA,True,57,2007-04-22
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Maks,Klanjscek,15,SG,SLO,False,70,1999-12-15
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Matteo,Da Ros,20,SF,ITA,True,65,1989-09-25
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Eric,Lombardi,21,SF,ITA,True,66,1993-02-01
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Riccardo,Tavernelli,22,PG,ITA,True,66,1991-03-16
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Christian,Burns,23,C,USA/ITA,True,63,1985-09-04
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Alberto,Bedin,24,C,ITA,True,65,1999-06-25
a2a_leonessa_bre,A2A Leonessa Brescia,serie_b_a,Gherardo,Sabatini,43,PG,ITA,True,65,1994-05-13
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Jerome,Ntsourou,2,PF/C,Congo,False,58,2006-09-26
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Bernardo,Musso,5,SG,ITA/ARG,True,65,1986-04-17
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Alfonso,Zampogna,6,PG,ITA,True,66,2000-11-02
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Vittorio,Moltrasio,10,SG,ITA,True,64,2003-06-30
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Luca,Carrabotta,11,PG/SG,ITA,True,55,2008-03-21
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Simas,Jasaitis,13,SF,LTU,False,70,1982-03-26
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Dmytro,Klyuchnyk,18,C,UKR,False,69,1994-08-28
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Ricards,Klanskis,19,C,LAT,False,67,2003-10-02
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Guglielmo,Sodero,21,PG/SG,ITA,True,67,1993-12-09
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Salvatore,Borriello,22,PG/SG,ITA,True,58,2006-08-28
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Marco,Timperi,23,SG/SF,ITA,True,65,1997-07-22
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Giacomo,Furin,49,C,ITA,True,63,2003-11-17
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Rosario,Orlando,55,,Italia,True,62,N/D
infodrive_capo_d,Infodrive Capo d'Orlando,serie_b_a,Riccardo,La Torre,55,,Italia,True,61,N/D
rimadesio_desio,Rimadesio Desio,serie_b_a,Alessio,Trezzi,1,SF,ITA,True,55,2008-02-01
rimadesio_desio,Rimadesio Desio,serie_b_a,Riccardo,Fossati,3,,ITA,True,62,N/D
rimadesio_desio,Rimadesio Desio,serie_b_a,Matteo,Tornari,6,PG/SG,ITA,True,65,1995-02-05
rimadesio_desio,Rimadesio Desio,serie_b_a,Elia,Sgarzini,7,PG,ITA,True,60,2004-10-31
rimadesio_desio,Rimadesio Desio,serie_b_a,Marco,Scalfi,8,SG/SF,ITA,True,53,2010-10-14
rimadesio_desio,Rimadesio Desio,serie_b_a,Victor,Manfredi,10,,ITA,True,60,N/D
rimadesio_desio,Rimadesio Desio,serie_b_a,Gabriele,D'Antoni,10,SF,ITA,True,53,2009-06-09
rimadesio_desio,Rimadesio Desio,serie_b_a,Morgan,Rashed,11,SG,ITA,True,63,2002-01-11
rimadesio_desio,Rimadesio Desio,serie_b_a,Gabriele,Giarelli,12,PF/C,Ita,True,67,1993-05-14
rimadesio_desio,Rimadesio Desio,serie_b_a,Riccardo,Rota,13,SF,ITA,True,62,2004-11-03
rimadesio_desio,Rimadesio Desio,serie_b_a,Kissima,Diambo,14,PF/C,CIV,False,67,2003-12-19
rimadesio_desio,Rimadesio Desio,serie_b_a,Andrea,Mazzoleni,18,SF,ITA,True,66,1998-06-04
rimadesio_desio,Rimadesio Desio,serie_b_a,Stefano,Elli,20,SF,ITA,True,60,2004-08-24
rimadesio_desio,Rimadesio Desio,serie_b_a,Lorenzo,Leoni,22,C,ITA,True,60,2006-10-14
rimadesio_desio,Rimadesio Desio,serie_b_a,Milo,Guastella,23,SG/SF,ITA,True,52,2010-05-23
rimadesio_desio,Rimadesio Desio,serie_b_a,Alberto,Granchi,33,C,ITA,True,59,2006-01-22
adamant_ferrara,Adamant Ferrara,serie_b_a,Cesare,Buriani,,,Italia,True,60,N/D
adamant_ferrara,Adamant Ferrara,serie_b_a,Luigi,Dioli,1,PG/SG,ITA,True,59,2006-04-26
adamant_ferrara,Adamant Ferrara,serie_b_a,Riccardo,Bottioni,6,PG,ITA,True,66,1993-10-27
adamant_ferrara,Adamant Ferrara,serie_b_a,Francesco,Paolin,9,PG/SG,ITA,True,68,1995-04-20
adamant_ferrara,Adamant Ferrara,serie_b_a,Lucio Gabriel,Delfino,10,PF/C,ARG,False,69,1997-02-27
adamant_ferrara,Adamant Ferrara,serie_b_a,Mattia,Melchiorri,11,SG/SF,ITA,True,66,1997-09-10
adamant_ferrara,Adamant Ferrara,serie_b_a,Bozo,Misolic,12,C,MNE,False,69,1999-02-16
adamant_ferrara,Adamant Ferrara,serie_b_a,Nicolò,Ianuale,13,SF,ITA,True,67,2001-12-05
adamant_ferrara,Adamant Ferrara,serie_b_a,Leonardo,Guerrieri,17,C,ITA,True,60,2006-12-11
adamant_ferrara,Adamant Ferrara,serie_b_a,Nicolò,Isotta,20,PG/SG,SUI/ITA,True,64,2003-05-30
adamant_ferrara,Adamant Ferrara,serie_b_a,Igor,Jovanovic,21,SG,ITA,True,63,2002-09-21
adamant_ferrara,Adamant Ferrara,serie_b_a,Carlo,Cappelletti,70,PG,ITA,True,63,2002-03-11
adamant_ferrara,Adamant Ferrara,serie_b_a,Giacomo,Goberti,99,,Italia,True,62,N/D
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Krisjanis,Mazburss,0,SG/SF,lat,False,54,2008-03-11
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Ilija,Biorac,1,C,ITA,True,60,2004-08-01
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Giorgio,Franceschi,4,SF,ITA,True,60,2005-04-21
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Paolo,Marinelli,5,PG/SG,CRO,False,70,1995-04-10
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Giacomo,Cecchinato,7,PG/SG,ITA,True,66,2001-03-30
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Olivers,Krilkovs,8,SG/SF,lat,False,52,2009-02-10
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Lorenzo,De Zardo,9,PF/C,ITA,True,67,1999-01-20
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Emils,Ivanovskis,11,PG/SG,SLO,False,64,2005-04-25
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Federico,Lui,12,C,ITA,True,60,2004-03-05
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Massimo,Frosini,14,SG/SF,ITA,True,57,2007-04-22
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Amedeo,Tiberti,32,SF,ITA,True,67,2000-03-10
fiorenzuola_bees,Fiorenzuola Bees,serie_b_a,Andrea,Ambrosetti,35,PG/SG,ITA,True,66,1999-07-28
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Roberto,Chessari,1,PG,ITA,True,66,2000-04-10
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Nicolas,Roli,5,,Italia,True,60,N/D
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Manuel,Saladini,7,PG,ITA,True,63,2002-01-13
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Giovanni,Gasparin,11,SG,ITA,True,68,1991-01-09
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Simon Obinna,Anaekwe,15,C,NGA,False,67,2001-10-18
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Alessandro,Cipolla,16,PG/SG,ITA,True,65,2000-02-16
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Jacopo,Preti,17,SF,ITA,True,67,1994-05-04
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Davide,Raucci,20,SF,ITA,True,69,1990-06-28
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Alessio,Noferini,21,,Italia,True,62,N/D
andrea_costa_imo,Andrea Costa Imola,serie_b_a,William Luca,Wiltshire,28,SG/SF,ITA,True,66,2001-08-23
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Christian Luigi,Kouassi,35,C,ITA,True,63,2003-11-30
andrea_costa_imo,Andrea Costa Imola,serie_b_a,Yordany,Angarica,45,SF,ITA,True,62,2005-01-26
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Luca,Giannone,1,SG/SF,ITA,True,64,2003-12-01
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Niccolo,Lisoni,5,SG,ITA,True,54,2008-06-24
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Guido,Scali,8,SG/SF,ITA,True,69,1998-04-30
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Andrea,Quinti,9,C,ITA,True,66,2001-07-30
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Francesco,Oboe,10,PG/SG,ITA,True,67,2000-10-30
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Alex,Nebuloni,14,PG/SG,ITA,True,57,2007-01-01
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Arsenije,Stepanovic,15,PG,SRB/ITA,True,65,2000-12-05
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Andrea,Oldrini,18,SF,ITA,True,54,2008-12-23
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Marek,Dolezaj,21,PF/C,SVK,False,71,1998-04-13
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Matteo,Beretta,22,PG/SG,ITA,True,67,1999-09-12
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Mattia,Mastroianni,35,SF,ITA,True,65,1994-03-06
sae_scientifica_,SAE Scientifica-Soevis Legnano Knights,serie_b_a,Alessandro,Scarponi,88,SG/SF,ITA,True,60,2004-01-03
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Giovanni,Guzzardi,2,SG,ITA,True,56,2008-02-27
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Dominik,Samija,3,SG/SF,CRO,False,69,1994-11-06
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Giacomo,Siberna,5,SG/SF,ITA,True,65,1996-01-08
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Federico,Gamberini,6,PG/SG,ITA,True,61,2005-09-06
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Francesco,Stefanelli,8,SG,ITA,True,65,1995-01-21
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Lorenzo,Varaschin,9,C,ITA,True,67,1998-06-08
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Michele,Rubbini,11,PG/SG,ITA,True,66,1999-07-03
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Marco,Cusin,12,C,ITA,True,64,1985-02-28
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Andrea,La Torre,14,SF,ITA,True,67,1997-06-14
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Nicolas,Alessandrini,23,SF,ITA,True,65,2001-05-08
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Federico,Mobilio,32,SG/SF,ITA,True,58,2007-09-05
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Martino,Criconia,33,SG/SF,ITA,True,66,1998-04-03
luxarm_lumezzane,LuxArm Lumezzane,serie_b_a,Niccolò,Piccionne,99,SG,ITA,True,61,2005-12-17
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Vinceslas,Chimi Kenfack,0,PF/C,CAM,False,56,2008-02-14
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Simone,Angelucci,1,SF,ITA,True,65,1998-06-11
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Francesco,Guerra,2,PG,ITA,True,66,2000-10-09
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Riccardo,Barbuto,3,PG,ITA,True,56,2008-02-18
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Leonardo,Caramelli,6,SG,ITA,True,56,2008-01-21
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Mouhamadou,Yadde,7,SF,SEN,False,59,2006-12-01
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Marco,Turra,8,SF,ITA,True,58,2007-05-09
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Marco,Contento,10,SG,ITA,True,68,1991-10-28
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Edoardo,Santi,11,PG,ITA,True,66,2001-12-01
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Elia,Morandotti,13,PG/SG,ITA,True,62,2005-03-11
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Jacopo,Balanzoni,14,C,ITA,True,68,1993-10-01
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Sebastiano,Bianchi,18,SF,ITA,True,65,1992-09-22
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Leonardo,Del Sole,21,PF/C,ITA,True,65,2000-03-08
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Andris,Misters,22,SF,LAT,False,70,1992-04-08
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Obinna,Odah,23,SF,ITA,True,61,2005-02-05
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Matteo,Bracesco,91,SF,ITA,True,54,2009-10-15
paffoni_fulgor_b,Paffoni Fulgor Basket Omegna,serie_b_a,Tommaso,Molteni,99,PG,ITA,True,67,1999-07-22
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Fabrizio,Piccone,1,PG/SG,ITA,True,65,1998-08-13
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Niccolò,Venturoli,3,SG,ITA,True,66,2000-11-15
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Roko,Rogic,6,PG,CRO,False,71,1992-09-25
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Nicolo,Dellosto,9,SF,ITA,True,65,2000-06-04
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Tommaso,Oxilia,10,C,ITA,True,68,1998-04-22
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Antonin,Handzlicek,12,SG,Rep. Ceca,False,54,2008-06-16
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Francesco,Bedetti,14,SF,ITA,True,66,1993-01-20
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Davide,Pittioni,15,PF/C,ita,True,56,2007-02-15
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Damiano,Zanardini,16,SG/SF,Ita,True,58,2007-10-16
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Alberto,Stefani,18,PF/C,Ita,True,63,2003-09-06
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Davide,Zilli,21,PF/C,ITA,True,61,2005-08-31
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Alberto,Cacace,22,SG,ITA,True,68,1996-06-22
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Tommaso,Minoli,36,PG/SG,Ita,True,65,1994-03-19
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Alessandro,Cattaneo,55,PG,Ita,True,55,2008-01-10
logiman_orzinuov,Logiman Orzinuovi,serie_b_a,Gabriele,Lucherini,73,SF,ITA,True,58,2007-05-14
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Dario,Spagnolo,,C,ITA,True,52,2009-08-31
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Pietro,Reginelli,,SG,ITA,True,56,2008-07-11
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Stefano,Olivieri,,PG,ITA,True,54,2008-08-02
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Gabriele,Cattivelli,,PG/SG,ITA,True,58,2007-08-11
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Matteo,Ermelani,1,SG/SF,ITA,True,57,2007-02-05
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Matteo,Picarelli,3,SG,ITA/SUI,True,65,2001-05-26
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Simone,Giunta,5,PG/SG,ITA,True,66,2000-03-16
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Giovanni,Poggi,9,PF/C,ITA,True,69,1997-03-27
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Massimiliano,Ferraro,11,SF,ITA,True,65,1998-11-25
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Enrico,Vettori,14,SG/SF,ITA,True,62,2004-03-08
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Federico,Pirani,15,C,ITA,True,63,2002-08-28
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Lorenzo,Vanin,20,C,ITA,True,60,2004-06-07
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Alberto,Fragonara,21,PG,ITA,True,60,2004-04-27
ucc_assigeco_pia,UCC Assigeco Piacenza,serie_b_a,Luca,Toniato,26,SG/SF,ITA,True,66,1998-09-18
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,José Alberto,Benites Vicente,2,PG,ITA-DOM,True,66,1997-11-02
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Nino,Buttafuoco,5,PG/SG,ita,True,56,2007-08-23
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Santiago,Bruno,8,SG,ITA-ARG,True,67,1993-05-31
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Antonio,Lorenzetti,9,PF/C,ITA,True,67,1995-06-30
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Nicola,Mastrangelo,11,SF,ITA,True,66,1998-06-28
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Matteo,Cagliani,12,SG/SF,ITA,True,65,2003-07-22
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Ernestas,Sederevicius,18,SG/SF,LTU,False,69,1998-11-13
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Franco,Gaetano,22,C,ITA,True,65,1999-01-16
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Denis,Alibegovic,23,SG/SF,SLO/ITA,True,67,1999-12-15
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Antonino,Sabatino,30,PG,ITA,True,65,2000-03-31
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Oumar,Dioumessy,34,C,ITA-GUINEA,True,62,2026-08-27
siaz_basket_piaz,Siaz Basket Piazza Armerina,serie_b_a,Federico,Ricci,41,PF/C,ITA,True,67,1997-05-13
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Soma,Abati Toure,0,SF,ITA,True,65,2002-04-10
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Baye Modou,Diouf,1,C,SEN,False,68,1999-09-02
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Celis,Taflaj,4,SF,ALB,False,69,1998-03-12
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Nikola,Markovic,8,SG/SF,SRB,False,69,2000-06-04
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Daniel,Love,10,SG,USA,False,70,1999-05-03
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Alessio,Donadoni,11,SF,ITA,True,65,1997-05-01
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Leonardo,Marini,15,C,ITA,True,66,1995-09-18
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Matteo,Calvellini,16,SG,ITA,True,63,2002-10-13
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Leonardo,Clark,22,PG,ITA,True,67,1998-12-14
myenergy_reggio_,Myenergy Reggio Calabria,serie_b_a,Gabriele,Romeo,99,PG/SG,ITA,True,67,1997-10-22
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Filippo,Testa,0,SG,ITA,True,67,1997-07-07
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Francesco,De Capitani,1,PG/SG,ITA,True,64,2002-09-18
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Carlo,Tosetti,3,PG,ITA,True,62,2005-10-19
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Pietro,Bocconcelli,4,SG/SF,ITA,True,65,1998-05-04
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Daniele,De Rosa,5,,Italia,True,60,N/D
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Davide,Laurenti,6,,Italia,True,60,N/D
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Matteo,Maruca,10,SG,ITA,True,66,1997-04-03
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Manuel,Di Meco,11,PF/C,ITA,True,67,1997-03-22
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Luca,Manenti,17,C,ITA,True,65,2002-06-21
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Giovanni,Lo Martire,18,SF,ITA,True,56,2007-09-19
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Kai,Edwards,19,C,NED,False,69,1997-08-10
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Gabriele,Crespi,20,SG,ITA,True,54,2008-03-17
ltc_group_sangio,LTC Group Sangiorgese Basket,serie_b_a,Francisco,Fernandez,31,SF,ARG,False,62,2004-06-25
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Marko,Brekic,3,SG/SF,SRB/CRO,False,68,2001-11-08
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Mattia,Da Campo,6,SG/SF,Italia,True,68,1999-04-19
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Lazar,Kekovic,9,SF,MNE,False,69,1997-05-01
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Elia,Mazzer,11,,Italia,True,62,N/D
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Ivan,Onojaife,12,C,Italia,True,64,2003-10-12
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Nicolas,Morici,13,SG/SF,ARG/ITA,True,66,1994-02-13
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Tommaso,Marangoni,14,SF,ITA,True,64,2003-03-21
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Daniele,Magro,18,C,ITA,True,64,1987-04-14
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Marco,Barattini,24,PG,ITA,True,65,2000-03-24
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Giovanni,Zanette,45,,Italia,True,62,N/D
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Mattia,Breda,45,,Italia,True,62,N/D
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Lionel,Abega,55,SG,ITA,True,60,2004-02-04
rucker_san_vende,Rucker San Vendemiano,serie_b_a,Alessandro,Chapelli,95,SG,ITA,True,62,2004-04-18
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Efe,Odiphri,0,C,NGR,False,57,2007-05-10
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Leonardo,Cemmi,2,SF,ITA,True,62,2005-08-05
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Pietro,Agostini,3,PF/C,ITA,True,65,1999-10-02
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Andrea,Mazzucchelli,5,PG/SG,ITA,True,66,1994-11-29
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Davide,Reati,8,SG/SF,ITA,True,69,1988-09-16
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Gabriele,Bucca,10,PG/SG,ITA,True,56,2008-12-06
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Fabio,Pagnoncelli,13,SF,ITA,True,57,2007-08-30
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Alessandro,Dore,14,PG/SG,ITA,True,58,2006-02-14
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Andrea,Guercetti,20,SG,ITA,True,52,2009-03-03
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Alessandro,Carparelli,21,SF,ITA,True,60,2006-06-23
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Davide,Buttiglione,29,SG,ITA,True,60,2006-04-27
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Lorenzo,Galli,30,SF,ITA,True,55,2008-09-24
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Miha,Muratović,34,C,SLO,False,68,2002-03-15
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Lorenzo,Pollini,35,PG,ITA,True,58,2006-06-13
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Andrea,Cefis,40,SF,ITA,True,54,2008-08-28
tav_treviglio_br,TAV Treviglio Brianza Basket,serie_b_a,Jacopo,Borra,99,C,ITA,True,65,1990-05-09
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Djibril Mattia,Fall,0,SF,ITA,True,60,2004-09-04
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Ayomide Samuel,Ojo,1,PG/SG,NGA,False,63,2004-11-04
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Thomas,Aguzzoli,5,SG/SF,ita,True,65,2000-09-27
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Leon,Polanco,10,PG/SG,ITA,True,59,2006-03-17
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Tomás,Fernández Lang,11,SG/SF,Arg,False,59,2006-04-18
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Niccolò,Pellicano,12,PG,ita,True,65,2002-03-02
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Nicolas,Fajardo,13,SG/SF,ITA,True,56,2008-03-14
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Georges Arthur,Tamani Kemda,15,C,CMR,False,66,2002-09-04
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Sebastian José,Gonzalez,16,PG,ITA,True,61,2005-09-19
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Jacopo,Trova,17,PG/SG,ITA,True,58,2007-03-16
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Mattia,Ghezzi,21,SF,ITA,True,57,2007-01-05
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Giulio,Martini,22,C,ITA,True,63,2002-04-07
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Nicolò,Frigo,24,SG,ITA,True,53,2009-09-01
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Pietro,Cecchin,31,SF,ITA,True,57,2007-08-28
s4_energia_vicen,S4 Energia Vicenza,serie_b_a,Oliver Seamus,Lynch-Daniels,33,SG,ITA,True,60,0998-02-17
felice_scandone_,Felice Scandone Avellino,serie_b_b,Lucas,Chaves,0,PG,ARG,False,70,1994-01-21
felice_scandone_,Felice Scandone Avellino,serie_b_b,Ethan Giuseppe,Owona,1,PG/SG,ITA,True,54,2009-03-03
felice_scandone_,Felice Scandone Avellino,serie_b_b,Jacopo,Vedovato,2,C,ITA,True,68,1995-01-13
felice_scandone_,Felice Scandone Avellino,serie_b_b,Simone,Vecerina,6,PG/SG,ITA,True,67,1999-10-05
felice_scandone_,Felice Scandone Avellino,serie_b_b,Bruno,Farias,7,PG/SG,ARG,False,58,2006-03-14
felice_scandone_,Felice Scandone Avellino,serie_b_b,Costantino,Carullo,8,,ita,True,61,N/D
felice_scandone_,Felice Scandone Avellino,serie_b_b,Nicola,Savoldelli,9,PG,ITA,True,65,1997-05-15
felice_scandone_,Felice Scandone Avellino,serie_b_b,Gianluca,Frattoni,11,PG,Ita/Arg,True,60,2004-04-07
felice_scandone_,Felice Scandone Avellino,serie_b_b,Darryl,Jackson,13,SG,USA/MLT,False,70,1985-12-17
felice_scandone_,Felice Scandone Avellino,serie_b_b,Antonio,Carullo,15,,ita,True,60,N/D
felice_scandone_,Felice Scandone Avellino,serie_b_b,Edoardo,Maresca,18,SF,ITA,True,67,1998-03-26
felice_scandone_,Felice Scandone Avellino,serie_b_b,Christian,Miro,19,,Italia,True,61,N/D
felice_scandone_,Felice Scandone Avellino,serie_b_b,Alessandro,Voltolini,20,SG,ITA,True,65,2001-12-29
felice_scandone_,Felice Scandone Avellino,serie_b_b,Fabio,Stefanini,21,SG/SF,ITA,True,67,1993-08-01
felice_scandone_,Felice Scandone Avellino,serie_b_b,Armando,Verazzo,26,SG/SF,ITA,True,63,2002-01-10
felice_scandone_,Felice Scandone Avellino,serie_b_b,Andrea,Donda,73,C,ITA,True,67,1999-08-11
felice_scandone_,Felice Scandone Avellino,serie_b_b,Andrea,De Blasio,77,,ITA,True,54,2008-03-31
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Tommaso,Balducci,0,SG,ITA,True,54,2008-06-16
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Francesco,Falorni,0,PG/SG,ITA,True,53,2009-09-09
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Federico,Natale,1,PF/C,ita,True,58,2006-12-02
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Nicolò,Bertocco,6,SG/SF,ITA,True,65,1995-09-16
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Filippo,Favaretto,7,PG,ITA,True,60,2006-08-13
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Edoardo,Bonivento,12,SG,ITA,True,56,2007-01-01
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Giulio,Candotto,13,SG,ITA,True,65,2001-07-13
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Gabriele,Berra,18,SG/SF,ITA,True,66,2000-08-01
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Lorenzo,Querci,21,SG/SF,ITA,True,67,2001-01-17
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Lorenzo,Raffaelli,22,PG,ITA,True,68,1999-01-22
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Lisandro,Rasio,32,SF,ARG,False,71,1990-12-30
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Dario,Zucca,33,PF/C,ITA,True,66,1996-02-17
umana_san_giobbe,Umana San Giobbe Chiusi,serie_b_b,Andrea,Macri,90,C,ITA,True,58,2007-03-08
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Daniel,Ohenhen,1,C,ITA,True,66,2001-01-04
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Santiago,Quarone,3,PG,ITA/ARG,True,58,2006-03-10
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Filiberto,Dri,5,SG/SF,ITA,True,68,1989-11-18
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Francesco,Gnecchi,8,SG/SF,ITA,True,67,1999-11-13
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Marco,Fogliato,10,SG/SF,ITA,True,57,2007-10-10
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Davide,Vavoli,13,SF,ITA,True,66,2001-02-27
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Alessandro,Gianoli,15,PF/C,ITA,True,65,2003-07-28
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Giacomo,Lupacchini,18,SG,ITA,True,52,2010-01-21
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Jacopo,Onesta,18,SG,ITA,True,54,2009-08-18
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Giacomo,Donati,19,SF,ITA,True,58,2006-02-11
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Lorenzo,Staffaroni,24,SG/SF,ITA,True,54,2008-08-29
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Emanuele,Pellacchia,24,SG/SF,ITA,True,55,2008-08-04
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Kaspar,Kuusmaa,55,PG,EST,False,66,2004-01-27
ristopro_fabrian,Ristopro Fabriano,serie_b_b,Karolis,Babusis,99,SG,LTU,False,68,2000-03-09
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Mattia,Lucadamo,0,C,ITA,True,56,2008-12-26
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Mattia,Pieri,0,SF,ITA,True,55,2008-12-10
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Michael,Renzi,0,PF/C,ITA,True,57,2007-11-12
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Deian,Rustenaj,0,SG,ALB,False,52,2009-01-15
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Simone,Tampieri,0,SG,ITA,True,53,2009-01-02
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Nicola,Battistini,0,SG,ITA,True,55,2008-02-22
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Francesco,Filippozzi,0,SF,ITA,True,52,2009-02-13
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,David,Gaina Catana,0,PG,ITA,True,52,2009-07-11
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Alessandro,Riva,2,PF/C,ITA,True,65,1998-11-12
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Eimantas,Stankevicius,4,PG/SG,LTU,False,70,1998-04-01
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Cheikh Mouhamadou,Sy,5,SF,SEN,False,52,2009-12-09
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Gianmarco,Bertetti,8,PG,ITA,True,67,2001-11-21
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Marco,Susanni,19,PG/SG,ITA,True,58,2007-01-19
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Leonardo,Sutter,23,,Italia,True,62,N/D
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Filippo,Rossi,33,PG,ITA,True,67,1997-06-29
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Francesco,Marcucci,35,PF/C,ITA,True,62,2005-12-17
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Marco,Di Pizzo,39,C,ITA,True,67,1998-08-12
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Raffaele,Romano,71,SF,ITA,True,65,2002-08-14
tema_sinergie_fa,Tema Sinergie Faenza,serie_b_b,Luca,Campori,77,SG/SF,ITA,True,65,1999-10-27
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Flavio,Dellisanti,0,SG,ITA,True,56,2008-02-04
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Ilario,Simonetti,7,SF,ITA,True,62,2004-05-27
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Lorenzo,Donadio,8,SG/SF,ITA,True,65,2001-02-25
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Gianmarco,Arletti,9,SG,ITA,True,63,2002-12-25
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Edoardo,Di Emidio,13,PG,ITA,True,65,1993-02-19
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Curtis,Nwohuocha,15,C,ITA,True,68,1997-01-16
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Andrea,Pastore,21,PG/SG,ITA,True,70,1994-09-01
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Nikola,Nonkovic,31,SF,ITA,True,63,2002-09-15
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Aleksa,Nikolic,46,SF,SRB/ITA,True,65,1999-05-03
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Ruben,Zugno,66,PG,ITA,True,65,1996-03-20
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Leonardo,Demetrio,71,SF,BRA,False,71,1994-03-24
benacquista_assi,Benacquista Assicurazioni Latina,serie_b_b,Gabriele,Calò,77,PG,ita,True,56,2007-01-25
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Andrea,Tassinari,0,PG,ITA,True,68,1996-06-12
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Michele,Ebeling,1,SG/SF,ITA,True,67,1999-01-03
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Lorenzo,Tortu',4,SF,ITA,True,67,1993-08-05
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Mattia,Venucci,11,PG,ITA,True,70,1990-10-31
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Matteo,Graziani,13,SG,ITA,True,67,2000-05-25
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Daniel,Donzelli,15,C,ITA,True,68,1996-09-28
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Ennio,Leonzio,20,SG,ITA,True,70,1994-09-14
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Antonio,Gallo,20,PG,ITA,True,67,2000-01-31
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Andrea,Traini,26,PG,ITA,True,67,1992-08-23
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Alessandro,Amici,31,SG/SF,ITA,True,68,1991-07-10
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,David,Gabrovsek,33,C,SLO,False,71,1994-09-18
verodol_cbd_piel,Verodol CBD Pielle Livorno,serie_b_b,Brian,Sacchetti,41,SF,ITA,True,70,1986-05-04
basketball_club_,Basketball Club Lucca,serie_b_b,Luca,Valentini,3,PG,ITA,True,66,1997-12-03
basketball_club_,Basketball Club Lucca,serie_b_b,Gian Marco,Drocker,4,PG/SG,ITA,True,65,2001-02-12
basketball_club_,Basketball Club Lucca,serie_b_b,Davide,Pittana,7,PG,ITA,True,58,2007-04-18
basketball_club_,Basketball Club Lucca,serie_b_b,Gianni,Dubois,8,SG/SF,ARG,False,68,0001-11-30
basketball_club_,Basketball Club Lucca,serie_b_b,Andrea,Barsanti,9,SG,ITA,True,63,1986-04-17
basketball_club_,Basketball Club Lucca,serie_b_b,Andrea,Simonetti,10,SF,ITA,True,65,2002-10-15
basketball_club_,Basketball Club Lucca,serie_b_b,Andrea,Del Debbio,12,SG,ITA,True,65,1999-02-15
basketball_club_,Basketball Club Lucca,serie_b_b,Andrea,Colussa,16,SF,ITA,True,66,2000-10-16
basketball_club_,Basketball Club Lucca,serie_b_b,Carlo,Balducci,18,SG/SF,ITA,True,64,2002-09-18
basketball_club_,Basketball Club Lucca,serie_b_b,Jacopo,Pierini,20,C,ITA,True,67,1997-02-19
basketball_club_,Basketball Club Lucca,serie_b_b,Magaye,Seck,22,C,SEN,False,67,2001-03-08
basketball_club_,Basketball Club Lucca,serie_b_b,Giovanni,Cortellino,24,PF/C,ITA,True,57,2007-03-08
basketball_club_,Basketball Club Lucca,serie_b_b,Carlo,Trentin,33,SG/SF,ITA,True,65,1996-04-18
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Carlos Manuel,Buendia,4,PG/SG,ARG,False,70,1995-03-13
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Marco,Rupil,6,SG,ITA,True,66,2001-06-06
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Marco,Giacomini,7,PG,ITA,True,66,1994-05-10
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Lucas,Maglietti,12,PG,ARG/ITA,True,65,2003-08-14
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Pio,Ruggiero,14,C,ITA,True,62,2004-08-11
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Giacomo,Lucchesini,15,SG,ITA,True,56,2008-11-18
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Kiryl,Tsetserukou,17,C,BLR,False,69,2001-07-26
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Daniele,Dell'uomo,18,SG,ITA,True,66,1998-10-19
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Francesco,Gravaghi,20,SG,ITA,True,65,2003-02-28
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Riccardo,Pascarella,21,PG,ITA,True,53,2009-03-18
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Matteo,Batini,22,SG/SF,ITA,True,54,2009-04-17
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Federico,Casoni,23,SF,ITA,True,67,1997-06-18
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Vittorio,Tica',24,SG,ITA,True,54,2008-05-18
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Giorgio,Sgobba,33,PF/C,ITA,True,69,1992-08-04
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Luca,Dicorato Romano,35,SG,ITA,True,56,2007-02-13
fabo_herons_mont,Fabo Herons Montecatini,serie_b_b,Tommaso,Pillastrini,77,SG,ITA,True,56,2007-03-11
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Luca,Galassi,1,PG/SG,ITA,True,66,1999-07-13
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Marco,Mennella,3,SG,ITA,True,65,1999-12-22
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Marks,Supe,7,PG,ITA,True,52,2009-03-23
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Francesco,D'Offizi,8,SG,ITA,True,64,2003-12-06
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Andrea,Valentini,9,C,ITA,True,67,1998-04-19
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Simone,Sinagra,10,PG,ITA,True,60,2005-01-28
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Luka,Tekavcic,14,SF,SLO,False,68,2002-05-21
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Giovanni,Lenti,15,C,ITA,True,66,1996-01-15
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Davide,Bonacini,17,PG,ITA,True,68,1990-06-15
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Gian Paolo,Almansi,23,SG,ITA,True,64,2002-09-21
skills4u_napoli_,Skills4u Napoli Est,serie_b_b,Jacopo,Lucarelli,99,SG/SF,ITA,True,66,1996-07-14
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Davide,Arduini,0,PG,ITALIANA,True,52,2009-08-18
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Joy,Pasquini,0,SF,italiana,True,52,2009-03-22
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,David,Cornis,1,,Italia,True,60,N/D
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Lorenzo,Baldi,2,PG,ITA,True,61,2005-04-09
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Marco,Panichi,5,SF,ITALIANA,True,58,2006-01-01
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Jacopo,Manzaroli,6,,Italia,True,61,N/D
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Quentin,Diboundje,7,PG/SG,FRA,False,68,2002-05-31
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Simone,Errede,7,SF,ITA,True,60,2006-05-11
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Elias,Weibert,8,PG/SG,SWE,False,68,2001-09-15
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Federico,Crescentini,9,,Italia,True,60,N/D
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Giovanni,Sablich,10,SF,ITA,True,62,2005-11-08
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Federico,Tognacci,12,PG/SG,ITA,True,67,2000-04-19
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Giancarlo,Favali,13,SG/SF,ITA,True,67,2000-05-10
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Gianluca,Giorgi,16,C,ITA,True,66,1995-12-16
consultinvest_lo,Consultinvest Loreto Pesaro,serie_b_b,Pierluigi,Mozzi,18,C,ITA,True,66,1998-03-22
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Edoardo,Pedroni,3,PG,ITA,True,66,1998-03-09
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Davide,Meluzzi,4,PG,ITA,True,68,1998-08-16
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Riccardo,Biancani,5,PG/SG,ITA,True,55,2008-01-01
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Niccolò,Moffa,7,SF,ITA,True,65,1999-05-14
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Marco,Menconi,8,PG/SG,ITA,True,64,2002-08-08
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Filippo,Martelli,9,SG,ITA,True,54,2008-01-01
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Samuele,Iacopini,10,SG/SF,ITA,True,56,2008-01-01
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Gianvito,Pipitone,11,C,ITA,True,56,2008-11-08
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Michael,Sacchettini,18,C,ITA,True,66,1995-01-06
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Luka,Virant,21,PF/C,SLO,False,56,2008-07-20
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Niccolò,Pistolesi,22,PF/C,ITA,True,65,2000-12-19
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Nik,Raivio,30,SG,USA,False,71,1986-02-06
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Tommaso,Gatto,31,PF/C,ITA,True,67,1996-11-28
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Adamu Adam,Abba,34,C,ITA,True,62,2004-05-25
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Gabriele,Ferraresi,44,SF,ITA,True,60,2005-11-15
solbat_golfo_pio,Solbat Golfo Piombino,serie_b_b,Fatih,Mehmedoviq,77,C,MNE,False,68,2000-02-01
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Leonardo,Mongelli,2,SG,ITA,True,59,2006-08-06
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Stefano,Pierotti Alles,4,PG,ARG,False,69,1998-01-20
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Simone,Roberto,7,PG/SG,ITA,True,65,2003-02-21
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Lorenzo,Scardigli,9,SG,ITA,True,54,2008-03-06
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Roberto,Parini,10,PG,ITA,True,56,2008-04-27
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Federico,Regoli,13,C,ITA,True,67,2000-10-06
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Jacopo,Rapetti,16,PF/C,ITA,True,60,2004-11-08
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Edoardo,Anibaldi,20,PG/SG,ITA,True,65,2003-06-29
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Jacopo,Bertoncin,28,C,ITA,True,60,2006-06-16
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Marco,Petrucci,31,SF,ITA,True,67,1992-06-30
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Mario,Machetti,68,PG,ITA,True,60,2004-11-08
consorzio_leonar,Consorzio Leonardo Dany Quarrata,serie_b_b,Cesare,Placinschi,99,C,ITA,True,58,2007-02-21
orasi_ravenna,OraSì Ravenna,serie_b_b,Alessandro,Forconi,0,SG/SF,ITA,True,60,2006-05-24
orasi_ravenna,OraSì Ravenna,serie_b_b,Alessandro,Feliciangeli,3,PG,ITA,True,59,2006-04-22
orasi_ravenna,OraSì Ravenna,serie_b_b,Kevin,Brigato,6,SG/SF,ITA,True,66,1998-12-03
orasi_ravenna,OraSì Ravenna,serie_b_b,Mattia,Mecenero,10,SF,ITA,True,57,2007-03-05
orasi_ravenna,OraSì Ravenna,serie_b_b,Stefano,Masciadri,11,SF,ITA,True,64,1989-03-12
orasi_ravenna,OraSì Ravenna,serie_b_b,Rolandas,Jakstas,14,PF/C,LTU,False,71,1992-09-28
orasi_ravenna,OraSì Ravenna,serie_b_b,Success,Eruke,19,C,ITA-NIG,True,60,2006-09-19
orasi_ravenna,OraSì Ravenna,serie_b_b,Alessandro,Casali,22,SG,ITA,True,54,2008-11-17
orasi_ravenna,OraSì Ravenna,serie_b_b,Gabriel,Dron,23,PG,ITA,True,63,2002-02-25
orasi_ravenna,OraSì Ravenna,serie_b_b,Giacomo,Baldini,28,SG,ITA,True,65,1996-03-25
orasi_ravenna,OraSì Ravenna,serie_b_b,Giacomo,Venturini,50,SG/SF,ITA,True,56,2008-02-24
orasi_ravenna,OraSì Ravenna,serie_b_b,Giacomo,Montefiori,55,SG,ITA,True,56,2008-06-02
luiss_roma,Luiss Roma,serie_b_b,Fabrizio,Pugliatti,1,SG/SF,ITA/VEN,True,61,2004-02-10
luiss_roma,Luiss Roma,serie_b_b,Valerio,Orsano,3,SG/SF,ITA,True,57,2007-07-14
luiss_roma,Luiss Roma,serie_b_b,Juan Manuel,Fernandez,4,PG/SG,ARG/ITA,True,66,1990-07-22
luiss_roma,Luiss Roma,serie_b_b,Edoardo,Bottelli,5,PG/SG,ITA,True,60,2005-06-27
luiss_roma,Luiss Roma,serie_b_b,Riccardo,Casella,7,PG,ITA,True,58,2006-11-07
luiss_roma,Luiss Roma,serie_b_b,Marco,Pasqualin,9,PG,ITA,True,66,1997-06-06
luiss_roma,Luiss Roma,serie_b_b,Filip,Krajina,11,C,CRO,False,69,1995-02-12
luiss_roma,Luiss Roma,serie_b_b,Giorgio,Alioto,14,PG,ITA,True,55,2008-02-07
luiss_roma,Luiss Roma,serie_b_b,Francesco,Eramo,16,SG/SF,ITA,True,58,2007-05-23
luiss_roma,Luiss Roma,serie_b_b,Marco,Bergamin,19,SG/SF,ITA,True,57,2007-08-25
luiss_roma,Luiss Roma,serie_b_b,Francesco,Paolini,20,SG/SF,ITA,True,58,2007-10-21
luiss_roma,Luiss Roma,serie_b_b,Valerio,Cucci,32,PF/C,ITA,True,69,1995-01-18
luiss_roma,Luiss Roma,serie_b_b,Mattia,Graziano,44,SG/SF,ITA,True,60,2004-11-25
luiss_roma,Luiss Roma,serie_b_b,Valerio,Longo,57,PF/C,ITA,True,62,2004-03-11
luiss_roma,Luiss Roma,serie_b_b,Mattia,Toselli,77,SF,ITA,True,57,2007-05-10
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Flavio,Talone,0,,Italia,True,62,N/D
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Alessandro,Panni,1,PG/SG,Italia,True,66,1991-12-27
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Giorgio,Piunti,2,C,ITA,True,66,1990-02-11
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Adrian,Chiera,5,SG,ITAARG,True,69,1994-12-16
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Andrea,Amato,6,PG,ITA,True,66,1994-03-12
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Daniele,Toscano,7,SF,ITA,True,65,1993-09-01
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Simone,Canavesi,9,,Italia,True,61,N/D
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Massimo,Sciamanna,9,,Italia,True,60,N/D
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Giannis,Odzebe,9,SF,CGO,False,64,2008-11-23
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,David,Jelinek,22,SG/SF,CZE,False,72,1990-09-07
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Sandro,Tanni,24,PG,ITA,True,54,2009-06-12
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Matteo,Visintin,25,PG,ITA,True,60,2004-03-24
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Yancarlos,Rodriguez,30,PG,ITA/DOM,True,66,1994-06-06
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Gianmarco,Leggio,33,SF,ITA,True,66,1994-08-06
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Filippo,Bonanni,34,,Italia,True,61,N/D
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Matias,Bortolin,41,C,ITA/ARG,True,66,1993-04-11
virtus_roma_gvm,Virtus Roma GVM,serie_b_b,Rei,Pullazi,55,SF,alb,False,71,1993-10-03
liofilchem_roset,Liofilchem Roseto,serie_b_b,Giordano,Durante,0,PG,ITA,True,69,2002-02-23
liofilchem_roset,Liofilchem Roseto,serie_b_b,Lamine,Tandia,1,C,MLI,False,65,2004-04-19
liofilchem_roset,Liofilchem Roseto,serie_b_b,Kirill,Selefenkov,2,PG,RUS,False,53,2009-12-11
liofilchem_roset,Liofilchem Roseto,serie_b_b,Alessio,Incoronato,3,PG/SG,ITA,True,56,2007-07-17
liofilchem_roset,Liofilchem Roseto,serie_b_b,Luca,Fabiani,8,C,ITA,True,65,2002-01-28
liofilchem_roset,Liofilchem Roseto,serie_b_b,Lukas,Aukstikalnis,9,SG,LTU,False,72,1995-08-19
liofilchem_roset,Liofilchem Roseto,serie_b_b,Richard Ygor,Morina,10,PG/SG,BRA/ITA,True,61,2004-07-17
liofilchem_roset,Liofilchem Roseto,serie_b_b,Giacomo,Gaiola,11,PG,ITA,True,59,2006-02-10
liofilchem_roset,Liofilchem Roseto,serie_b_b,Matteo Francis,Ciocca,12,SG/SF,ITA/ENG,True,52,2009-07-07
liofilchem_roset,Liofilchem Roseto,serie_b_b,Alessandro,Cistola,15,SF,ITA,True,54,2009-03-11
liofilchem_roset,Liofilchem Roseto,serie_b_b,Sabino,Malual,17,SF,SUD,False,59,2006-06-02
liofilchem_roset,Liofilchem Roseto,serie_b_b,Marco,Mazzoni,19,SF,ITA,True,64,2003-07-05
liofilchem_roset,Liofilchem Roseto,serie_b_b,Steven Daniel,Mkouonga,20,,Italia,True,62,N/D
liofilchem_roset,Liofilchem Roseto,serie_b_b,Raphael,Chiti,21,SG/SF,ITA,True,66,1999-09-08
liofilchem_roset,Liofilchem Roseto,serie_b_b,Andrea,Petracca,70,SF,ITA,True,66,1997-08-03
liofilchem_roset,Liofilchem Roseto,serie_b_b,Alberto,Pellizzari,88,PG/SG,ITA,True,60,2005-05-20
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Diego Jordan,Lucas,0,PG/SG,ITA,True,67,1996-12-11
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Matteo,Morelli,1,SF,ITA,True,61,2005-06-25
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Manuele,Pezzani,2,SG/SF,ITA,True,59,2006-12-19
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Riccardo,Romondia,3,PG,ITA,True,61,2005-04-08
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Dino,Laurino,4,PG,ITA,True,52,2009-03-16
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Joaquin,Sarmiento,6,PF/C,ARG,False,58,2007-01-18
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Andrea,Gattel,8,SG,ITA,True,60,2005-03-25
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Francesco,Greco,9,PG,ITA,True,56,2008-05-11
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Matteo,Todisco,10,PF/C,ITA,True,62,2005-02-14
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,René Maurice,Ndour,13,C,ITA,True,66,2000-07-09
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Paolo,Bandini,21,PG/SG,ITA,True,60,2004-01-03
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Emanuele,Di Rico,22,SG,ITA,True,57,2007-05-01
allianz_pazienza,Allianz Pazienza Cestistica San Severo,serie_b_b,Fabio,Bugatti,45,SF,ITA,True,67,1998-10-31
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Rems,Merosa,1,SG/SF,LAT,False,55,2008-12-23
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Federico,Pillepich,2,PF/C,ita,True,56,2008-01-24
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Edoardo,Pannini,4,PG,ITA,True,67,1999-12-06
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Marco,Perin,6,PG/SG,ITA,True,66,1993-07-24
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Lapo,Calviani,7,PG/SG,ITA,True,54,2008-06-26
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Dimitri,Lodoli,8,,Italia,True,61,N/D
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Andrea,Cecchi,10,SF,ITA,True,62,2005-01-23
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Simone,Cerchiaro,11,PG/SG,ITA,True,65,2003-03-27
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Barou,Yarbanga,12,PF/C,MLI,False,63,2005-03-27
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Edoardo,Caversazio,16,SF,ITA,True,68,1996-09-14
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Ettore,Cesaretti,21,,ITA,True,54,2010-10-21
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Leonardo,Battistini,22,SF,ITA,True,65,1995-05-19
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Bernardo,Bucalossi,25,,ITA,True,55,2008-10-07
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Okko,Jarvi,32,SG,FIN,False,70,1996-01-12
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Balsa,Jokic,44,PF/C,MNE,False,68,2003-01-02
sendero_mens_san,Sendero Mens Sana Siena,serie_b_b,Vittorio,Zedda,55,PG/SG,ITA,True,61,2004-02-26`;

const SERIE_B_TEAM_ALIASES: Record<string, string> = {
  // Girone A (ITA_B) — codici brevi legacy + slug RATED 2026/27
  agr: 'ita_b_agrigento_bk',
  moncada_energy_a: 'ita_b_agrigento_bk',
  bre_b: 'ita_b_brescia_basket',
  a2a_leonessa_bre: 'ita_b_brescia_basket',
  cdo: 'ita_b_capo_d_orlando_bk',
  infodrive_capo_d: 'ita_b_capo_d_orlando_bk',
  des: 'ita_b_desio_bk',
  rimadesio_desio: 'ita_b_desio_bk',
  fer: 'ita_b_ferrara_basket',
  adamant_ferrara: 'ita_b_ferrara_basket',
  fio: 'ita_b_fiorenzuola_bk',
  fiorenzuola_bees: 'ita_b_fiorenzuola_bk',
  imo: 'ita_b_ac_imola',
  andrea_costa_imo: 'ita_b_ac_imola',
  leg: 'ita_b_legnano_bk',
  sae_scientifica_: 'ita_b_legnano_bk',
  lum: 'ita_b_lumezzane_basket',
  luxarm_lumezzane: 'ita_b_lumezzane_basket',
  ome: 'ita_b_fulgor_omegna',
  paffoni_fulgor_b: 'ita_b_fulgor_omegna',
  orz: 'ita_b_orzinuovi_bk',
  logiman_orzinuov: 'ita_b_orzinuovi_bk',
  pia: 'ita_b_piacenza_a',
  ucc_assigeco_pia: 'ita_b_piacenza_a',
  paz: 'ita_b_piazza_armerina_bk',
  siaz_basket_piaz: 'ita_b_piazza_armerina_bk',
  rcb: 'ita_b_viola_rc',
  myenergy_reggio_: 'ita_b_viola_rc',
  sgi: 'ita_b_sangiorgese_bk',
  ltc_group_sangio: 'ita_b_sangiorgese_bk',
  sve: 'ita_b_san_vendemiano_bk',
  rucker_san_vende: 'ita_b_san_vendemiano_bk',
  tre_b: 'ita_b_treviglio_bk',
  tav_treviglio_br: 'ita_b_treviglio_bk',
  vic: 'ita_b_vicenza_basket',
  s4_energia_vicen: 'ita_b_vicenza_basket',

  // Girone B (ITA_B2) — codici brevi legacy + slug RATED 2026/27
  sca_av: 'ita_b2_lupi_avellino',
  felice_scandone_: 'ita_b2_lupi_avellino',
  chi: 'ita_b2_chiusi_basket',
  umana_san_giobbe: 'ita_b2_chiusi_basket',
  fab: 'ita_b2_fabriano_bk',
  ristopro_fabrian: 'ita_b2_fabriano_bk',
  fae: 'ita_b2_faenza_bk',
  tema_sinergie_fa: 'ita_b2_faenza_bk',
  lat: 'ita_b2_latina_basket',
  benacquista_assi: 'ita_b2_latina_basket',
  pie_li: 'ita_b2_pl_livorno',
  verodol_cbd_piel: 'ita_b2_pl_livorno',
  luc: 'ita_b2_lucca_bk',
  basketball_club_: 'ita_b2_lucca_bk',
  her_mo: 'ita_b2_montecatini_h',
  fabo_herons_mont: 'ita_b2_montecatini_h',
  psa: 'ita_b2_napoli_est_bk',
  skills4u_napoli_: 'ita_b2_napoli_est_bk',
  lor_pe: 'ita_b2_l_pesaro',
  consultinvest_lo: 'ita_b2_l_pesaro',
  pio: 'ita_b2_piombino_bk',
  solbat_golfo_pio: 'ita_b2_piombino_bk',
  qua: 'ita_b2_quarrata_bk',
  consorzio_leonar: 'ita_b2_quarrata_bk',
  rav: 'ita_b2_ravenna_basket',
  orasi_ravenna: 'ita_b2_ravenna_basket',
  lui: 'ita_b2_roma_l',
  luiss_roma: 'ita_b2_roma_l',
  vro: 'ita_b2_vir_roma_60',
  virtus_roma_gvm: 'ita_b2_vir_roma_60',
  ros: 'ita_b2_roseto_bk',
  liofilchem_roset: 'ita_b2_roseto_bk',
  sse: 'ita_b2_san_severo_bk',
  allianz_pazienza: 'ita_b2_san_severo_bk',
  sie: 'ita_b2_ms_siena',
  sendero_mens_san: 'ita_b2_ms_siena',
};

const SERIE_B_TEAM_NAME_ALIASES: Record<string, string> = {
  'moncada energy agrigento': 'ita_b_agrigento_bk',
  'agrigento bk': 'ita_b_agrigento_bk',
  'a2a leonessa brescia': 'ita_b_brescia_basket',
  'brescia basket': 'ita_b_brescia_basket',
  "infodrive capo d'orlando": 'ita_b_capo_d_orlando_bk',
  "capo d'orlando bk": 'ita_b_capo_d_orlando_bk',
  'rimadesio desio': 'ita_b_desio_bk',
  'desio bk': 'ita_b_desio_bk',
  'adamant ferrara': 'ita_b_ferrara_basket',
  'ferrara basket': 'ita_b_ferrara_basket',
  'fiorenzuola bees': 'ita_b_fiorenzuola_bk',
  'fiorenzuola bk': 'ita_b_fiorenzuola_bk',
  'andrea costa imola': 'ita_b_ac_imola',
  'ac imola': 'ita_b_ac_imola',
  'sae scientifica-soevis legnano knights': 'ita_b_legnano_bk',
  'legnano bk': 'ita_b_legnano_bk',
  'luxarm lumezzane': 'ita_b_lumezzane_basket',
  'lumezzane basket': 'ita_b_lumezzane_basket',
  'paffoni fulgor basket omegna': 'ita_b_fulgor_omegna',
  'fulgor omegna': 'ita_b_fulgor_omegna',
  'logiman orzinuovi': 'ita_b_orzinuovi_bk',
  'orzinuovi bk': 'ita_b_orzinuovi_bk',
  'ucc assigeco piacenza': 'ita_b_piacenza_a',
  'piacenza a': 'ita_b_piacenza_a',
  'siaz basket piazza armerina': 'ita_b_piazza_armerina_bk',
  'piazza armerina bk': 'ita_b_piazza_armerina_bk',
  'myenergy reggio calabria': 'ita_b_viola_rc',
  'viola rc': 'ita_b_viola_rc',
  'ltc group sangiorgese basket': 'ita_b_sangiorgese_bk',
  'sangiorgese bk': 'ita_b_sangiorgese_bk',
  'rucker san vendemiano': 'ita_b_san_vendemiano_bk',
  'san vendemiano bk': 'ita_b_san_vendemiano_bk',
  'tav treviglio brianza basket': 'ita_b_treviglio_bk',
  'treviglio bk': 'ita_b_treviglio_bk',
  's4 energia vicenza': 'ita_b_vicenza_basket',
  'vicenza basket': 'ita_b_vicenza_basket',
  'felice scandone avellino': 'ita_b2_lupi_avellino',
  'lupi avellino': 'ita_b2_lupi_avellino',
  'umana san giobbe chiusi': 'ita_b2_chiusi_basket',
  'chiusi basket': 'ita_b2_chiusi_basket',
  'ristopro fabriano': 'ita_b2_fabriano_bk',
  'fabriano bk': 'ita_b2_fabriano_bk',
  'tema sinergie faenza': 'ita_b2_faenza_bk',
  'faenza bk': 'ita_b2_faenza_bk',
  'benacquista assicurazioni latina': 'ita_b2_latina_basket',
  'latina basket': 'ita_b2_latina_basket',
  'verodol cbd pielle livorno': 'ita_b2_pl_livorno',
  'pl livorno': 'ita_b2_pl_livorno',
  'basketball club lucca': 'ita_b2_lucca_bk',
  'lucca bk': 'ita_b2_lucca_bk',
  'fabo herons montecatini': 'ita_b2_montecatini_h',
  'montecatini h': 'ita_b2_montecatini_h',
  'skills4u napoli est': 'ita_b2_napoli_est_bk',
  'napoli est bk': 'ita_b2_napoli_est_bk',
  'consultinvest loreto pesaro': 'ita_b2_l_pesaro',
  'l pesaro': 'ita_b2_l_pesaro',
  'solbat golfo piombino': 'ita_b2_piombino_bk',
  'piombino bk': 'ita_b2_piombino_bk',
  'consorzio leonardo dany quarrata': 'ita_b2_quarrata_bk',
  'quarrata bk': 'ita_b2_quarrata_bk',
  'orasì ravenna': 'ita_b2_ravenna_basket',
  'orasi ravenna': 'ita_b2_ravenna_basket',
  'ravenna basket': 'ita_b2_ravenna_basket',
  'luiss roma': 'ita_b2_roma_l',
  'roma l': 'ita_b2_roma_l',
  'virtus roma gvm': 'ita_b2_vir_roma_60',
  'vir roma 60': 'ita_b2_vir_roma_60',
  'liofilchem roseto': 'ita_b2_roseto_bk',
  'roseto bk': 'ita_b2_roseto_bk',
  'allianz pazienza cestistica san severo': 'ita_b2_san_severo_bk',
  'san severo bk': 'ita_b2_san_severo_bk',
  'sendero mens sana siena': 'ita_b2_ms_siena',
  'ms siena': 'ita_b2_ms_siena',
};

const JERSEY_POOL = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 44, 55,
];

const COUNTRY_TO_NATIONALITY: Record<string, Nationality> = {
  ita: 'ITA',
  italia: 'ITA',
  italiana: 'ITA',
  itaarg: 'ITA',
  usa: 'USA',
  canada: 'USA',
  'regno unito': 'USA',
  eng: 'USA',
  mlt: 'USA',
  sud: 'USA',
  nigeria: 'USA',
  nga: 'USA',
  ngr: 'USA',
  serbia: 'SRB',
  srb: 'SRB',
  montenegro: 'SRB',
  mne: 'SRB',
  'bosnia ed erzegovina': 'SRB',
  'macedonia del nord': 'SRB',
  albania: 'SRB',
  alb: 'SRB',
  spagna: 'ESP',
  esp: 'ESP',
  'repubblica dominicana': 'ESP',
  dom: 'ESP',
  bra: 'ESP',
  ven: 'ESP',
  lituania: 'LTU',
  ltu: 'LTU',
  ucraina: 'LTU',
  ukr: 'LTU',
  bielorussia: 'LTU',
  blr: 'LTU',
  rus: 'LTU',
  francia: 'FRA',
  fra: 'FRA',
  mali: 'FRA',
  mli: 'FRA',
  senegal: 'FRA',
  sen: 'FRA',
  camerun: 'FRA',
  cam: 'FRA',
  cmr: 'FRA',
  ghana: 'FRA',
  civ: 'FRA',
  cgo: 'FRA',
  congo: 'FRA',
  guinea: 'FRA',
  germania: 'GER',
  ger: 'GER',
  aut: 'GER',
  sui: 'GER',
  'repubblica ceca': 'GER',
  'rep. ceca': 'GER',
  cze: 'GER',
  svk: 'GER',
  ned: 'GER',
  swe: 'GER',
  fin: 'GER',
  argentina: 'ARG',
  arg: 'ARG',
  grecia: 'GRE',
  gre: 'GRE',
  slovenia: 'SLO',
  slo: 'SLO',
  croazia: 'CRO',
  cro: 'CRO',
  lettonia: 'LAT',
  lat: 'LAT',
  est: 'LAT',
};

function parseSerieBPosition(rawPos: string): { primaryPosition: Position; secondaryPosition?: Position } {
  const parts = rawPos
    .trim()
    .toUpperCase()
    .split('/')
    .map((p) => p.trim() as Position);
  const primaryPosition = parts[0] || 'SF';
  const secondaryPosition = parts[1] && parts[1] !== primaryPosition ? parts[1] : undefined;
  return { primaryPosition, secondaryPosition };
}

function parseSerieBNationality(rawNat: string, isItalianFormation: boolean): Nationality {
  const segments = rawNat
    .trim()
    .toLowerCase()
    .split(/[/\-]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (
    segments[0] === 'italia' ||
    segments[0] === 'ita' ||
    segments[0] === 'italiana' ||
    segments[0] === 'itaarg'
  ) {
    return 'ITA';
  }

  for (const seg of segments) {
    const mapped = COUNTRY_TO_NATIONALITY[seg];
    if (mapped && mapped !== 'ITA') return mapped;
  }

  return isItalianFormation ? 'ITA' : 'USA';
}

function buildSerieBRealRosters(): Record<string, CustomPlayerTemplate[]> {
  const teamTemplateById = new Map(ALL_TEAM_TEMPLATES.map((t) => [t.id, t]));
  const grouped = new Map<
    string,
    Array<{
      firstName: string;
      lastName: string;
      primaryPosition: Position;
      secondaryPosition?: Position;
      nationality: Nationality;
      isItalianFormation: boolean;
      jerseyNumber?: number;
      overall?: number;
      birthDate?: string;
    }>
  >();

  const lines = RAW_SERIE_B_PLAYERS_CSV.trim().split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    if (cols.length < 9) continue;

    const csvTeamCode = cols[0].trim().toLowerCase();
    const csvTeamName = cols[1].trim().toLowerCase();
    const firstName = cols[3].trim();
    const lastName = cols[4].trim();
    const rawJersey = cols[5].trim();
    const rawPos = cols[6].trim();
    const rawNat = cols[7].trim();
    const rawItaForm = cols[8].trim().toLowerCase();
    const rawOvr = (cols[9] ?? '').trim();
    const rawBirthDate = (cols[10] ?? '').trim();

    const teamId = SERIE_B_TEAM_ALIASES[csvTeamCode] ?? SERIE_B_TEAM_NAME_ALIASES[csvTeamName];
    if (!teamId) continue;

    const { primaryPosition, secondaryPosition } = parseSerieBPosition(rawPos);
    const isItalianFormation = rawItaForm === 'true' || rawItaForm === '1' || rawItaForm === 'si';
    const nationality = parseSerieBNationality(rawNat, isItalianFormation);
    const jerseyNum = rawJersey ? Number(rawJersey) : undefined;
    const overall = rawOvr ? Number(rawOvr) : undefined;
    const birthDate = parseBirthDateToItalian(rawBirthDate);

    const list = grouped.get(teamId) ?? [];
    list.push({
      firstName,
      lastName,
      primaryPosition,
      secondaryPosition,
      nationality,
      isItalianFormation,
      jerseyNumber: Number.isFinite(jerseyNum) ? jerseyNum : undefined,
      overall: Number.isFinite(overall) ? overall : undefined,
      birthDate,
    });
    grouped.set(teamId, list);
  }

  const refDate = getSeasonAgeReferenceDate(2026);
  const result: Record<string, CustomPlayerTemplate[]> = {};
  for (const [teamId, players] of grouped.entries()) {
    const tpl = teamTemplateById.get(teamId);
    const baseOvr = tpl ? tpl.avgOverall : 55;

    result[teamId] = players
      .map((p, idx) => {
        let ovrOffset: number;
        if (idx < 5) {
          ovrOffset = 4 - Math.floor(idx / 2);
        } else if (idx < 10) {
          ovrOffset = 1 - (idx - 5);
        } else {
          ovrOffset = -4 - Math.min(3, idx - 10);
        }

        const age = p.birthDate ? computeAgeFromBirthDate(p.birthDate, refDate) : undefined;

        return {
          firstName: p.firstName,
          lastName: p.lastName,
          jerseyNumber: p.jerseyNumber ?? JERSEY_POOL[idx % JERSEY_POOL.length],
          primaryPosition: p.primaryPosition,
          secondaryPosition: p.secondaryPosition,
          age,
          birthDate: p.birthDate,
          nationality: p.nationality,
          isItalianFormation: p.isItalianFormation,
          overall: p.overall ?? Math.max(46, Math.min(72, baseOvr + ovrOffset)),
        };
      })
      .sort((a, b) => b.overall - a.overall);
  }

  return result;
}

export const SERIE_B_REAL_ROSTERS: Record<string, CustomPlayerTemplate[]> = buildSerieBRealRosters();

export const SERIE_B_REAL_BIRTHDATES_BY_NAME: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const roster of Object.values(SERIE_B_REAL_ROSTERS)) {
    for (const p of roster) {
      if (p.birthDate) {
        map[`${p.firstName} ${p.lastName}`.trim().toLowerCase()] = p.birthDate;
      }
    }
  }
  return map;
})();
