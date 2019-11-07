import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { StylingService } from './styling.service';
import { AutoNumberService } from './autonumber.service';
import { UtilityService } from './utility.service';

@Injectable({
  providedIn: 'root'
})
export class GenerateService {

  constructor(private utility: UtilityService, private styling: StylingService, private http: HttpClient, private autonumbering: AutoNumberService) { }

  /* #region variables   */
  timeoutId;
  isDoneProcessing: boolean = false;
  halfwayDoneProcessing: boolean = false;
  refresh: boolean = false;
  canRefresh: boolean = true;
  svg: any
  rectangled: any;
  png: any
  text: any = "Bob->Alice : hello"
  hiddenNotes: boolean = true;
  hiddenFootnotes: boolean = true;
  hiddenShadows: boolean = true;
  themedHiddenNotes: boolean = true;
  themedHiddenFootnotes: boolean = true;
  themedHiddenShadows: boolean = true;
  isThemed: boolean = false;
  textImages: boolean = false;
  participantpadding = 0;
  participantfontsize = 13;
  participantstroke = 1.5;
  sequencetextsize = 13;
  themedParticipantpadding = 0;
  themedParticipantfontsize = 13;
  themedParticipantstroke = 1.5;
  themedSequencetextsize = 13;
  types = ['Sequence', 'Usecase', 'Class'];
  shapes = ['Rectangle', 'Rounded', 'Ellipse', 'Circle'];
  autonumber = ['None', 'Default', 'Circular', 'Rectangular', 'Rounded', 'Rectangular-Framed', 'Circular-Framed', 'Rounded-Framed'];
  actors = ['Default', 'Modern'];
  breaks = ['Default', 'Squiggly'];
  fonts = ['Tahoma'];
  themes = ['PlantUML', 'ISAAC', 'Johan', 'Graytone'];
  color1 = '';
  color2 = '';
  color3 = '';
  color4 = '';
  color5 = '';
  color6 = '';
  color7 = '';
  color8 = '';
  color9 = '';
  selectedSize = '14'
  selectedTheme = 'PlantUML';
  selectedType = 'Sequence';
  selectedFont = 'Tahoma';
  selectedBreak = 'Default';
  selectedActor = 'Default';
  selectedShape = 'Rectangle';
  selectedNumber = 'None';
  themedType = 'Sequence';
  themedFont = 'Tahoma';
  themedBreak = 'Default';
  themedActor = 'Default';
  themedShape = 'Rectangle';
  themedNumber = 'None';
  img;
  /* #endregion */

  async generateSVG(text: string) {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(async () => {
      console.log("generating...");
      //setting the variables to the ones needed for themes
      this.setTheme();
      //make the text ready for generation
      text = this.changeText(document, text);
      //generate the svg and set it to the svg variable while checking if its rounded 
      var oDOM;
      this.isThemed ? oDOM = await this.getData(text, this.themedShape == 'Rounded' ? 20 : 1, this) : oDOM = await this.getData(text, this.selectedShape == 'Rounded' ? 20 : 1, this)
      this.styleSVG(oDOM);
    }, 300);
  }
  resetRectangle(text) {
    text = "skinparam roundcorner 1  \n " + text;
    text = "skinparam notefontsize 12 \n " + text;
    var t = unescape(encodeURIComponent(text))
    this.http.get(environment.api.base + this.utility.encode64(deflate(t, 9)), { responseType: 'text' }).subscribe(
      data => {
        this.svg = data;
      });
  }
  styleSVG(oDOM) {
    //removing all the styling PlantUML puts on it
    this.styling.removeStyling(oDOM);
    this.isThemed ? this.styling.setNode(oDOM, this.themedShape, this.textImages) : this.styling.setNode(oDOM, this.selectedShape, this.textImages);
    this.isThemed ?
      (this.themedHiddenNotes ? this.hideNotes() : this.showNotes()) :
      (this.hiddenNotes ? this.hideNotes() : this.showNotes());
    this.setColors(oDOM);
    this.styling.findNamesInText(oDOM);
    this.addListners();
    this.setAutoNumberLabel(oDOM);
    this.isThemed ?
      (this.themedActor == 'Modern' ? this.styling.setNewActor(oDOM) : null) :
      (this.selectedActor == 'Modern' ? this.styling.setNewActor(oDOM) : null);
    this.isThemed ?
      (this.themedBreak == 'Squiggly' ? this.styling.setSquiggly(oDOM) : null) :
      (this.selectedBreak == 'Squiggly' ? this.styling.setSquiggly(oDOM) : null);
    this.setFont(oDOM);
    this.setStroke(oDOM);
    this.triggerResize(oDOM);
    var s = new XMLSerializer();
    var str = s.serializeToString((oDOM as XMLDocument).firstChild);
    this.svg = str;
  }

  changeText(oDOM, text: string) {
    this.text = text;
    if (this.isThemed) {
      text = this.utility.replaceAll(text, 'Actor', 'actor')
      if (!this.themedHiddenFootnotes)
        text = 'hide footbox \n' + text
      if (!this.themedHiddenShadows)
        text = 'skinparam Shadowing false \n' + text
      text = `skinparam notefontsize 12 \n ` + text;
      text = `skinparam   ParticipantPadding  ${this.themedParticipantpadding} \n` + text
      text = `skinparam   ParticipantFontSize ${this.themedParticipantfontsize} \n` + text
      text = `skinparam   ActorFontSize ${this.themedParticipantfontsize} \n` + text
      text = `skinparam   ArrowFontSize  ${this.themedSequencetextsize} \n` + text

      text = 'skinparam SequenceDividerFontSize 14 \n' + text
      text = 'skinparam SequenceDividerFontSize 14 \n' + text
      switch (this.themedNumber) {
        case 'None':
          break;
        case 'Default':
          text = 'autonumber 1\n' + text;
          this.styling.clearLabels(oDOM);
          break;
        case 'Circular':
          text = 'autonumber 1\n' + text;
          text = `skinparam   Padding  4 \n` + text
          break;
        case 'Rectangular':
          text = 'autonumber 1\n' + text;
          text = `skinparam   Padding  4 \n` + text
          break;
        case 'Rectangular-Framed':
          text = `skinparam   Padding  4 \n` + text
          text = 'autonumber 1\n' + text;
          break;
        case 'Circular-Framed':
          text = `skinparam   Padding  4 \n` + text
          text = 'autonumber 1\n' + text;
          break;
        case 'Rounded-Framed':
          text = `skinparam   Padding  4 \n` + text
          text = 'autonumber 1\n' + text;
          break;
        case 'Rounded':
          text = `skinparam   Padding  4 \n` + text
          text = 'autonumber 1\n' + text;
          break;
        default:
          break;
      }
    }
    else {
      text = this.utility.replaceAll(text, 'Actor', 'actor')
      if (!this.hiddenFootnotes)
        text = 'hide footbox \n' + text
      if (!this.hiddenShadows)
        text = 'skinparam Shadowing false \n' + text

      text = `skinparam   ParticipantPadding  ${this.participantpadding} \n` + text
      text = `skinparam   ParticipantFontSize ${this.participantfontsize} \n` + text
      text = `skinparam   ActorFontSize ${this.participantfontsize} \n` + text
      text = `skinparam   ArrowFontSize  ${this.sequencetextsize} \n` + text

      text = 'skinparam SequenceDividerFontSize 14 \n' + text
      text = 'skinparam SequenceDividerFontSize 14 \n' + text
      switch (this.selectedNumber) {
        case 'None':
          break;
        case 'Default':
          text = 'autonumber 1\n' + text;
          this.styling.clearLabels(oDOM);
          break;
        case 'Circular':
          text = 'autonumber 1\n' + text;
          text = `skinparam   Padding  4 \n` + text
          break;
        case 'Rectangular':
          text = 'autonumber 1\n' + text;
          text = `skinparam   Padding  4 \n` + text
          break;
        case 'Rectangular-Framed':
          text = `skinparam   Padding  4 \n` + text
          text = 'autonumber 1\n' + text;
          break;
        case 'Circular-Framed':
          text = `skinparam   Padding  4 \n` + text
          text = 'autonumber 1\n' + text;
          break;
        case 'Rounded-Framed':
          text = `skinparam   Padding  4 \n` + text
          text = 'autonumber 1\n' + text;
          break;
        case 'Rounded':
          text = `skinparam   Padding  4 \n` + text
          text = 'autonumber 1\n' + text;
          break;
        default:
          break;
      }
    }
    return text;
  }
  async getData(text, roundcorner, generate) {
    return new Promise(function (resolve, reject) {
      text = `skinparam roundcorner ${roundcorner}  \n ${text}`;
      generate.styling.getActors(text);
      var t = unescape(encodeURIComponent(text))
      generate.http.get(environment.api.base + generate.utility.encode64(deflate(t, 9)), { responseType: 'text' }).subscribe(
        data => {
          data = (data as string).replace("<svg", `<svg id="svgTag"`);
          var oParser = new DOMParser();
          var oDOM = oParser.parseFromString(data, "image/svg+xml");
          // generate.svg = data;
          setTimeout(() => {
            resolve(oDOM);
          }, 100);
        });
    });
  }
  hideNotes() {
    this.utility.getTagList('path').forEach((element: SVGRectElement) => {
      if (element.getAttribute('class') == null) {
        element.setAttribute('display', 'none');
        element.setAttribute('name', 'note');
      }
    });
    this.utility.getTagList('polygon').forEach((element: SVGRectElement) => {
      if (element.getAttribute('points').split(',').length >= 9) {
        element.setAttribute('display', 'none');
        element.setAttribute('name', 'note');
      }
    });
    this.utility.getTagList('text').forEach((element: SVGRectElement) => {
      if (element.getAttribute('font-size') == '12') {
        element.setAttribute('display', 'none');
        element.setAttribute('name', 'note');
      }
    });
  }
  showNotes() {
    var notes: any = document.getElementsByName('note')
    var list = Array.from(notes);
    list.forEach((element: SVGRectElement) => {
      element.setAttribute('display', '');
    });
  }
  ShowNotes() {
    this.showNotes();
  }
  HideNotes() {
    if (this.isThemed) {
      if (!this.themedHiddenNotes) {
        this.hideNotes();
      } else {
        this.showNotes();
      }
    }
    else {
      if (!this.hiddenNotes) {
        this.hideNotes();
      } else {
        this.showNotes();
      }
    }
  }
  setColors(oDOM) {
    if (this.isThemed) {
      if (this.selectedTheme == 'PlantUML') {
        this.styling.addColorToStyle(
          '#a80036',
          '#fefece',
          '#fbfb77',
          '#3a3a3a',
          '#000000',
          '#a80036',
          '#a80036',
          '#fefece',
          '#000000', 
          oDOM)
      }
      else if (this.selectedTheme == 'ISAAC') {
        this.styling.addColorToStyle(
          '#009ddc',
          '#ffffff',
          '#f3f3f3',
          '#009ddc',
          '#000000',
          '#009ddc',
          '#009ddc',
          '#ffffff',
          '#000000', 
          oDOM)
      }
      else if (this.selectedTheme == 'Johan') {
        this.styling.addColorToStyle(
          '#a6dee1',
          '#a6dee1',
          '#32bdb8',
          '#32bdb8',
          '#737373',
          '#737373',
          '#32bdb8',
          '#32bdb8',
          '#ffffff', 
          oDOM)
      }
      else if (this.selectedTheme == 'Graytone') {
        this.styling.addColorToStyle(
          '#bfbcbc',
          '#ffffff',
          '#bfbcbc',
          '#3a3a3a',
          '#000000',
          '#bfbcbc',
          '#bfbcbc',
          '#ffffff',
          '#707070', 
          oDOM)
      }
    } else {
      this.styling.addColorToStyle(
        this.color1,
        this.color2,
        this.color3,
        this.color4,
        this.color5,
        this.color6,
        this.color7,
        this.color8,
        this.color9, 
        oDOM)

    }
  }
  addListners() {
    this.utility.getTagList('rect').forEach((element: SVGRectElement) => {
      if (element.getAttribute('rx') != null) {
        this.addListenersTo(element)
        this.addListenersTo(element.nextElementSibling)
      }
    })
    this.utility.getTagList('image').forEach((element: SVGRectElement) => {
      this.addListenersTo(element)
      this.addListenersTo(element.nextElementSibling)
    })
    this.utility.getTagList('ellipse').forEach((element: SVGRectElement) => {
      this.addListenersTo(element)
      this.addListenersTo(element.nextElementSibling)
    })
    this.utility.getTagList('circle').forEach((element: SVGRectElement) => {
      this.addListenersTo(element)
      this.addListenersTo(element.nextElementSibling)
    })
  }
  addListenersTo(element) {
    element.addEventListener('mouseover', () => {
      this.showNotes();
    });
    element.addEventListener('mouseenter', () => {
      this.showNotes();
    });
    element.addEventListener('mouseleave', () => {
      this.hideNotes();
    })
  }
  setAutoNumberLabel(oDOM) {
    if (this.isThemed) {
      if (this.themedNumber == 'Circular') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberCircular(oDOM);
      } else if (this.themedNumber == 'Rectangular') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberRectangular(oDOM);
      } else if (this.themedNumber == 'Rectangular-Framed') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberRectangularFramed(oDOM);
      } else if (this.themedNumber == 'Rounded-Framed') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberRoundedFramed(oDOM);
      } else if (this.themedNumber == 'Circular-Framed') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberCircularFramed(oDOM);
      } else if (this.themedNumber == 'Rounded') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberRounded(oDOM);
      }
    }
    else {
      if (this.selectedNumber == 'Circular') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberCircular(oDOM);
      } else if (this.selectedNumber == 'Rectangular') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberRectangular(oDOM);
      } else if (this.selectedNumber == 'Rectangular-Framed') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberRectangularFramed(oDOM);
      } else if (this.selectedNumber == 'Rounded-Framed') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberRoundedFramed(oDOM);
      } else if (this.selectedNumber == 'Circular-Framed') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberCircularFramed(oDOM);
      } else if (this.selectedNumber == 'Rounded') {
        this.styling.clearLabels(oDOM);
        this.autonumbering.setAutonumberRounded(oDOM);
      }
    }
  }
  setFont(oDOM) {
    if (document.getElementById('googlelink')) {
      document.getElementById('googlelink').setAttribute('href', 'https://fonts.googleapis.com/css?family=' + this.selectedFont);
    } else {
      var headID = document.getElementsByTagName('head')[0];
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.id = 'googlelink'
      headID.appendChild(link);
      link.href = 'https://fonts.googleapis.com/css?family=' + this.selectedFont;
    }
    oDOM.getElementById('svgTag').style.setProperty(`--font-stack`, this.selectedFont)
  }
  setStroke(oDOM) {
    if (this.isThemed) {
      oDOM.getElementById('svgTag').style.setProperty(`--participant-stroke-width`, this.themedParticipantstroke.toString())
    }
    else {
      oDOM.getElementById('svgTag').style.setProperty(`--participant-stroke-width`, this.participantstroke.toString())
    }
  }
  triggerResize(oDOM) {
    oDOM.getElementById('svgTag').style.setProperty(`--font-size`, this.selectedSize)
  }
  isaacStyle() {
    this.themedBreak = 'Squiggly';
    this.themedNumber = 'Circular';
    this.themedShape = 'Rounded';
    this.themedActor = 'Modern';
    this.themedFont = 'Tahoma'
    this.themedHiddenFootnotes = false;
    this.themedHiddenShadows = true;
    this.themedParticipantfontsize = 13;
    this.themedSequencetextsize = 13;
  }
  JohanStyle() {
    this.themedBreak = 'Squiggly';
    this.themedNumber = 'Circular';
    this.themedShape = 'Rectangle';
    this.themedActor = 'Modern';
    this.themedFont = 'Muli'
    this.themedHiddenFootnotes = false;
    this.themedHiddenShadows = false;
    this.themedParticipantfontsize = 18;
    this.themedSequencetextsize = 13;
  }
  GrayToneStyle() {
    this.themedBreak = 'Squiggly';
    this.themedNumber = 'Circular';
    this.themedShape = 'Rectangle';
    this.themedActor = 'Modern';
    this.themedFont = 'Open Sans'
    this.themedHiddenFootnotes = false;
    this.themedHiddenShadows = false;
    this.themedParticipantfontsize = 18;
    this.themedSequencetextsize = 13;
    this.themedParticipantstroke = 2;

  }
  plantumlStyle() {
    this.themedBreak = 'Default';
    this.themedNumber = 'None';
    this.themedShape = 'Rectangle';
    this.themedActor = 'Default';
    this.themedFont = 'Roboto'
    this.themedHiddenFootnotes = true;
    this.themedHiddenShadows = true;
    this.themedParticipantfontsize = 13;
    this.themedSequencetextsize = 13;
  }
  setTheme() {
    if (this.isThemed) {
      if (this.selectedTheme == 'PlantUML') {
        this.plantumlStyle()
      }
      else if (this.selectedTheme == 'ISAAC') {
        this.isaacStyle();
      }
      else if (this.selectedTheme == 'Johan') {
        this.JohanStyle();
      }
      else if (this.selectedTheme == 'Graytone') {
        this.GrayToneStyle();
      }
    }
  }
}