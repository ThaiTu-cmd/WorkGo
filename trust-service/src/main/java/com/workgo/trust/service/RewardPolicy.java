package com.workgo.trust.service;
public final class RewardPolicy {
    private RewardPolicy(){}
    public record Quote(int points,boolean needsReview,String modelVersion,String ruleVersion,String inputHash){}
    public static Quote evaluate(String untrustedDescription,boolean complexScope,int days,boolean integration,Integer aiPoints,String model){
        int rubric=2+(complexScope?1:0)+(days>=3?1:0)+(integration?1:0);
        boolean invalid=aiPoints!=null&&(aiPoints<2||aiPoints>5)||days<1||days>36500||model!=null&&model.length()>100;
        int points=invalid||aiPoints==null?2:Math.min(rubric,aiPoints);
        String version=model==null||model.isBlank()?"DISABLED":model;
        String hash=ReputationService.hash(untrustedDescription+"|"+complexScope+"|"+days+"|"+integration+"|"+aiPoints+"|"+version);
        return new Quote(points,invalid,version,"WG-POLICY-1.0",hash);
    }
}
