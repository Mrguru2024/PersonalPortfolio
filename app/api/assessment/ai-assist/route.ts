import { NextRequest, NextResponse } from "next/server";
import { aiAssistanceService } from "@server/services/aiAssistanceService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, context, currentAnswers } = body;
    
    let result: any;
    
    switch (type) {
      case 'generate-ideas':
        result = {
          suggestions: await aiAssistanceService.generateIdeas(
            context,
            currentAnswers?.projectType
          ),
        };
        break;
        
      case 'suggest-features':
        result = {
          suggestions: await aiAssistanceService.suggestFeatures(
            context,
            currentAnswers?.mustHaveFeatures || []
          ),
        };
        break;
        
      case 'improve-description':
        result = {
          improvedText: await aiAssistanceService.improveDescription(
            context,
            currentAnswers?.projectType
          ),
        };
        break;
        
      case 'clarify-requirements':
        result = {
          suggestions: await aiAssistanceService.clarifyRequirements(
            context,
            currentAnswers || {}
          ),
        };
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid assistance type" },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in AI assistance:", error);
    return NextResponse.json(
      { error: "Failed to process AI assistance request" },
      { status: 500 }
    );
  }
}
