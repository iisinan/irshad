UPDATE stock_statuses
SET status = 'halal', reason = 'Based on the July 2026 NGX Shariah compliance screening.', verified_by_scholar = true, confidence_score = 100, last_updated = NOW(), updated_at = NOW()
WHERE company_id IN (
    SELECT id FROM companies WHERE symbol IN ('ABCTRANS', 'ACADEMY', 'ALEX', 'ARADEL', 'AUSTINLAZ', 'BAPLC', 'BERGER', 'BUACEMENT', 'BUAFOODS', 'CADBURY', 'CAP', 'CAVERTON', 'CHAMS', 'CHELLARAM', 'CILEASING', 'CONHALLPLC', 'CONOIL', 'CUTIX', 'DANGSUGAR', 'ECHOTEK', 'ETRANZACT', 'EVERIDON', 'GEREGU', 'JAIZBANK', 'JULI', 'LASACO', 'LINKASSURE', 'MAYBAKER', 'MCNICHOLS', 'MORISON', 'MTNN', 'MULTIVERSE', 'NAHCO', 'NASCON', 'NCR', 'NSLTECH', 'OANDO', 'OMATEK', 'PHARMDEKO', 'PRESCO', 'REGENCYINS', 'SEPLAT', 'TRANSCOHOT', 'UNILEVER', 'UNIONDICON', 'UPDCREIT', 'UPL', 'VITAFOAM')
);

UPDATE stock_statuses
SET status = 'doubtful', reason = 'Based on the July 2026 NGX Shariah compliance screening.', verified_by_scholar = true, confidence_score = 100, last_updated = NOW(), updated_at = NOW()
WHERE company_id IN (
    SELECT id FROM companies WHERE symbol IN ('AFROMEDIA', 'CMFC', 'DELUXEPROP', 'UHOMREIT', 'ZICHIS')
);

UPDATE stock_statuses
SET status = 'non-halal', reason = 'Based on the July 2026 NGX Shariah compliance screening.', verified_by_scholar = true, confidence_score = 100, last_updated = NOW(), updated_at = NOW()
WHERE company_id IN (
    SELECT id FROM companies WHERE symbol IN ('CHAMPION', 'CNIF', 'FCMB', 'FIDELITYBK', 'INTBREW', 'LVBANK', 'NNFM', 'STANBIC')
);
