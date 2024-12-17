const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CARBONE_API_KEY = 'test_eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMDQ3NjgyMTc1OTMyNzc3MDQyIiwiYXVkIjoiY2FyYm9uZSIsImV4cCI6MjM5NjYwODY0OCwiZGF0YSI6eyJ0eXBlIjoidGVzdCJ9fQ.AavvTDPQ8NHgX61J0genvbMb9_umu3Ue4FsvAyBv3nUHJtbJvM78wBzM_45zJsSYv-l5hCcHn_ERU-vnk1S-l5y1ANTz_uHnMlz6NXZAnlZJzbUSnwQh8nFjaGgZX7lQlxEkVrC193S-38nGaNkq1ht4SFf5HALrYc0s2iJNAcyPihUM';
const TEMPLATE_ID = '7283294d14db7d8f00577a0777e8e39ff9ae02eb533b32fcc62ce7c218062810';
const CARBONE_API_URL = 'https://api.carbone.io';

const generatePDF = async () => {
    const recipeData = JSON.parse(fs.readFileSync('data/recipe.json', 'utf8'));
    
    const convertToGrams = (weight) => {
        const [value, unit] = weight.split(' ');
        const numValue = parseFloat(value);
        
        switch(unit.toLowerCase()) {
            case 'tbsp': return `${numValue * 15} g`;
            case 'tsp': return `${numValue * 5} g`;
            case 'kg': return `${numValue * 1000} g`;
            case 'oz': return `${numValue * 28.35} g`;
            case 'lb': return `${numValue * 453.59} g`;
            case 'cup': return `${numValue * 236.59} g`;
            case 'ml': return `${numValue} g`;
            case 'gm':
            case 'g': return `${numValue} g`;
            case 'mg': return `${numValue / 1000} g`;
            default: return `${numValue} g`;
        }
    };

    const templateData = {
        name: recipeData.name[0],
        totalTime: recipeData.Instruction.reduce((sum, step) => sum + step.durationInSec, 0) / 60,
        timelineBackground: "#000000",
        Ingredients: recipeData.Ingredients.map(ing => ({
            weight: convertToGrams(ing.weight),
            title: ing.title,
            text: ing.text,
            image: ing.image ? { isImage: true, data: ing.image } : null
        })),
        Instruction: recipeData.Instruction.map(inst => {
            const severityBg = inst.stirrer_on === "3" ? "#FF0000" :
                              inst.stirrer_on === "2" ? "#FFA500" :
                              inst.stirrer_on === "1" ? "#808080" : "#000000";
            console.log(`Instruction ${inst.id} - stirrer_on: ${inst.stirrer_on}, color: ${severityBg}`);
            return {
                ...inst,
                backgroundColor: "#000000",
                severityBackground: severityBg,
                yellowBackground: "#FFFF00"
            };
        })
    };

    try {
        const renderResponse = await axios.post(`${CARBONE_API_URL}/render/${TEMPLATE_ID}`, {
            data: templateData,
            convertTo: 'pdf'
        }, {
            headers: {
                'Authorization': CARBONE_API_KEY
            }
        });

        const pdfResponse = await axios.get(`${CARBONE_API_URL}/render/${renderResponse.data.data.renderId}`, {
            headers: {
                'Authorization': CARBONE_API_KEY
            },
            responseType: 'arraybuffer'
        });

        fs.writeFileSync('recipe.pdf', pdfResponse.data);
        console.log('PDF generated successfully!');
    } catch (error) {
        console.error('Error generating PDF:', error.response?.data || error.message);
    }
};

generatePDF();
