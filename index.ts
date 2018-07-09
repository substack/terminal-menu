import Menu, {IMenuOpts} from './menu';

export = function MenuFactory(opts: IMenuOpts) {
    return new Menu(opts);
}
